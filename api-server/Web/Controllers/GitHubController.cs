using System.Collections.Concurrent;
using System.Data;
using System.Text;
using System.Web;
using CS.Core.Configuration;
using CS.Core.Entities;
using CS.Core.Entities.V2;
using CS.Web.Models.Api.Request;
using CS.Web.Models.Api.Response;
using Dapper;
using GitHubJwt;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Npgsql;
using Octokit;
using Octokit.GraphQL;
using Octokit.GraphQL.Core;
using Octokit.GraphQL.Core.Introspection;
using Octokit.GraphQL.Model;
using static Octokit.GraphQL.Variable;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]
public class GitHubController : ControllerBase
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly CoreConfiguration _coreConfiguration;
    private readonly IWebHostEnvironment _environment;

    public GitHubController(IHttpContextAccessor httpContextAccessor, CoreConfiguration coreConfiguration, IWebHostEnvironment environment)
    {
        _httpContextAccessor = httpContextAccessor;
        _coreConfiguration = coreConfiguration;
        _environment = environment;
    }

    private string _githubProductHeaderName = "HubReviewApp";
    private string _githubProductHeaderVersion = "1.0.0";

    private GitHubClient GetGitHubClient(string token)
    {
        return new GitHubClient(new Octokit.ProductHeaderValue(_githubProductHeaderName))
        {
            Credentials = new(token, AuthenticationType.Bearer)
        };
    }

    // Reason for obsolete attribute below:
    // The problem is that we have to use GitHub's OAuth apps for many features, particularly with GraphQL.
    // However, installations work best when coupled with OAuth performed through a GitHub App (which we can't do).
    // There are workarounds, such as asking the user to authorize the GitHub App for installation-related features,
    // but we actually don't even have any features that would require an installation client, at least as of now and for the
    // foreseeable future.
    // However, we do use GitHub App webhooks, so installations are still needed for some features to work.
    [Obsolete("Avoid using any form of GitHub installation client, prefer `GitHubUserClient`")]
    private async Task<GitHubClient> GetGitHubInstallationClient(Octokit.Installation installation)
    {
        var installationToken = await GitHubAppClient.GitHubApps.CreateInstallationToken(installation.Id);
        return GetGitHubClient(installationToken.Token);
    }

    private string GitHubAppToken
    {
        get
        {
            var jwtFactory = new GitHubJwtFactory(
                new FilePrivateKeySource("../private-key.pem"),
                new GitHubJwtFactoryOptions
                {
                    AppIntegrationId = _coreConfiguration.AppId,
                    ExpirationSeconds = (int)TimeSpan.FromMinutes(5).TotalSeconds // 10 minutes is the maximum time allowed
                }
            );

            return jwtFactory.CreateEncodedJwtToken();
        }
    }

    private GitHubClient? _githubAnonymousClient;
    private GitHubClient GitHubAnonymousClient => _githubAnonymousClient ??= new GitHubClient(new Octokit.ProductHeaderValue(_githubProductHeaderName));

    private GitHubClient? _githubAppClient;
    private GitHubClient GitHubAppClient => _githubAppClient ??= GetGitHubClient(GitHubAppToken);

    private const string _userAccessTokenSessionKey = "UserAccessToken";
    private const string _userLoginSessionKey = "UserLogin";

    private string? UserAccessToken => _httpContextAccessor?.HttpContext?.Session.GetString(_userAccessTokenSessionKey);
    private string? UserLogin => _httpContextAccessor?.HttpContext?.Session.GetString(_userLoginSessionKey);
    private bool IsLoggedIn => UserAccessToken is not null;

    private void SetUserAccessToken(Octokit.OauthToken token) =>
        _httpContextAccessor?.HttpContext?.Session.SetString(_userAccessTokenSessionKey, token.AccessToken);
    private void SetUserLogin(Octokit.User user) =>
        _httpContextAccessor?.HttpContext?.Session.SetString(_userLoginSessionKey, user.Login);

    private GitHubClient? _githubUserClient;
    private GitHubClient GitHubUserClient
    {
        get
        {
            if (_githubUserClient is not null) return _githubUserClient;

            if (UserAccessToken is null)
                throw new InvalidOperationException("Tried to create GitHub user client, but found no token");
            return _githubUserClient = GetGitHubClient(UserAccessToken);
        }
    }

    private Octokit.GraphQL.Connection GetGitHubGraphQLConnection(string token)
    {
        return new Octokit.GraphQL.Connection(
            new Octokit.GraphQL.ProductHeaderValue(_githubProductHeaderName, _githubProductHeaderVersion),
            token);
    }

    private Octokit.GraphQL.Connection? _githubUserGraphQLConnection;
    private Octokit.GraphQL.Connection GitHubUserGraphQLConnection
    {
        get
        {
            if (_githubUserGraphQLConnection is not null) return _githubUserGraphQLConnection;

            if (UserAccessToken is null)
                throw new InvalidOperationException("Tried to create GitHub user GraphQL connection, but found no token");
            return _githubUserGraphQLConnection = GetGitHubGraphQLConnection(UserAccessToken);
        }
    }

    private static string GenerateRandomColor()
    {
        var random = new Random();
        var color = String.Format("#{0:X6}", random.Next(0x1000000)); // Generates a random color code in hexadecimal format
        return color;
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/summary")]
    public async Task<ActionResult> summary(string owner, string repoName, int prnumber, [FromQuery] bool regen = false)
    {
        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);

        string query = $"SELECT summary FROM pullrequestinfo WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";
        string? summary = null;

        connection.Open();

        var command = new NpgsqlCommand(query, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            summary = reader.IsDBNull(0) ? null : reader.GetString(0);
        }

        connection.Close();

        if (summary != null && !regen)
        {
            return Ok(summary.Replace("''", "'"));
        }

        var files = await GitHubUserClient.PullRequest.Files(owner, repoName, prnumber);
        var selected = string.Join("\n\n", files.Select(file => $"{file.FileName}:\n\n{file.Patch}"));

        var prompt = "summarize in detail the diff files from my pull request given below, as a list of file names and their explanations:\n\n";
        var concat = prompt + selected;

        if (concat.Length >= 50000)
        {
            return Ok("Unfortunately, this pull request is too long to generate a summary");
        }

        var client = new HttpClient();

        await Task.Delay(TimeSpan.FromSeconds(2));

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Add("Authorization", "Bearer " + _coreConfiguration.OpenaiApiKey);

        var requestData = new
        {
            model = "gpt-3.5-turbo",
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = concat
                }
            }
        };

        request.Content = new StringContent(JsonConvert.SerializeObject(requestData), Encoding.UTF8, "application/json");

        HttpResponseMessage response = await client.SendAsync(request);
        string responseBody = await response.Content.ReadAsStringAsync();
        var res = JsonConvert.DeserializeObject<ChatCompletionResponseModel>(responseBody);
        var summaryContent = res?.Choices?[0].Message?.Content;

        query = $"UPDATE pullrequestinfo SET summary = '{summaryContent?.Replace("'", "''")}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

        connection.Open();
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }
        connection.Close();

        return Ok(summaryContent ?? "");
    }

    [HttpGet("acquireToken")]
    public async Task<ActionResult> AcquireToken([FromQuery] string code, [FromQuery] string state)
    {
        var stateObject = JsonConvert.DeserializeAnonymousType(HttpUtility.UrlDecode(state), new { from = "" });

        var request = new OauthTokenRequest(
            clientId: _coreConfiguration.OAuthClientId,
            clientSecret: _coreConfiguration.OAuthClientSecret,
            code: code);

        var token = await GitHubAnonymousClient.Oauth.CreateAccessToken(request);
        SetUserAccessToken(token);

        var user = await GitHubUserClient.User.Current();
        SetUserLogin(user);

        var baseUrl = _environment.IsProduction() ? "https://hubreview.app" : "http://localhost:5173";
        var returnPathName = stateObject?.from ?? "";
        return Redirect(baseUrl + returnPathName);
    }

    [HttpGet("/users/current")]
    public async Task<ActionResult> GetCurrentUser()
    {
        if (!IsLoggedIn) return Unauthorized();

        var user = await GitHubUserClient.User.Current();

        SetUserLogin(user);

        return Ok(new
        {
            Login = user.Login,
            AvatarUrl = user.AvatarUrl,
        });
    }

    [HttpGet("logoutUser")]
    public ActionResult LogoutUser()
    {
        _httpContextAccessor?.HttpContext?.Session.Clear();
        return Ok();
    }

    [HttpGet("getRepository")]
    public async Task<ActionResult> GetRepositories()
    {
        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        Dictionary<string, bool> repoAdminsCache = new Dictionary<string, bool>();
        List<RepoInfo> allRepos = new List<RepoInfo>();
        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = "SELECT id, name, ownerLogin, created_at, onlyadmin FROM repositoryinfo WHERE id = ANY(@repos) ORDER BY name ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@repos", repos);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var ownerlog = reader.GetString(2);

                        bool isAdmin;
                        if (repoAdminsCache.ContainsKey(ownerlog))
                        {
                            isAdmin = repoAdminsCache[ownerlog];
                        }
                        else
                        {
                            isAdmin = await GetRepoAdmins(ownerlog, UserLogin);
                            repoAdminsCache[ownerlog] = isAdmin;
                        }

                        var repo = new RepoInfo
                        {
                            Id = reader.GetInt64(0),
                            Name = reader.GetString(1),
                            OwnerLogin = ownerlog,
                            CreatedAt = reader.GetFieldValue<DateOnly>(3),
                            IsAdmin = isAdmin,
                            onlyAdmin = reader.GetBoolean(4)
                        };
                        allRepos.Add(repo);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(new { RepoNames = allRepos });
    }

    [HttpGet("getRepository/{id}")]
    public async Task<ActionResult> GetRepositoryById(int id)
    {
        var repository = await GitHubUserClient.Repository.Get(id);

        if (repository is null)
            return NotFound();
        return Ok(repository);
    }

    [HttpGet("/pullrequests/{owner}/{repoName}/{prNumber}")]
    public async Task<ActionResult> GetPRByNumber(string owner, string repoName, long prNumber)
    {
        var query = PullRequestDetails.GetQuery();

        var pullRequestDetails = await GitHubUserGraphQLConnection.Run(query, new Dictionary<string, object>
        {
            { "repoName", repoName },
            { "owner", owner },
            { "prNumber", prNumber },
        });

        var restApiPR = await GitHubUserClient.Repository.PullRequest.Get(owner, repoName, (int)prNumber);

        pullRequestDetails.MergeStateStatus = PullRequestDetails.MergeStateStatusEnum.From(restApiPR.MergeableState?.Value);

        return Ok(pullRequestDetails);
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prNumber}/addLabel")]
    public async Task<ActionResult> AddLabelToPR(string owner, string repoName, long prNumber, [FromBody] List<string> labelNames)
    {
        try
        {
            var repositoryLabels = await GitHubUserClient.Issue.Labels.GetAllForRepository(owner, repoName);
            var labelsToAdd = new List<Octokit.Label>();

            foreach (var labelName in labelNames)
            {
                var label = repositoryLabels.FirstOrDefault(l => l.Name.Equals(labelName, StringComparison.OrdinalIgnoreCase));
                if (label == null)
                {
                    var randomColor = GenerateRandomColor();
                    label = await GitHubUserClient.Issue.Labels.Create(
                        owner,
                        repoName,
                        new NewLabel(labelName, randomColor.Substring(1)));
                }
                labelsToAdd.Add(label);
            }
            await GitHubUserClient.Issue.Labels.AddToIssue(owner, repoName, (int)prNumber, labelsToAdd.Select(l => l.Name).ToArray());

            return Ok($"Labels '{string.Join(",", labelNames)}' added to pull request #{prNumber} in repository {repoName}.");
        }
        catch (NotFoundException)
        {
            return NotFound($"Pull request with number {prNumber} not found in repository {repoName}.");
        }
    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{prNumber}/{labelName}")]
    public async Task<ActionResult> RemoveLabelFromPR(string owner, string repoName, long prNumber, string labelName)
    {
        try
        {
            await GitHubUserClient.Issue.Labels.RemoveFromIssue(owner, repoName, (int)prNumber, labelName);
            return Ok($"Label '{labelName}' removed from pull request #{prNumber} in repository {repoName}.");
        }
        catch (NotFoundException)
        {
            return NotFound($"Pull request with number {prNumber} in repository {repoName} does not have a label named {labelName}.");
        }
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/request_review")]
    public async Task<ActionResult> requestReview(string owner, string repoName, long prnumber, [FromBody] string[] reviewers)
    {
        try
        {
            // TODO: add support for team reviewers
            var reviewRequest = new PullRequestReviewRequest(reviewers, null);
            var pull = await GitHubUserClient.PullRequest.ReviewRequest.Create(owner, repoName, (int)prnumber, reviewRequest);

            using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
            connection.Open();

            string query = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

            using (var command = new NpgsqlCommand(query, connection))
            {
                command.ExecuteNonQuery();
            }
            connection.Close();

            return Ok($"{string.Join(",", reviewers)} is requested to review PR #{prnumber}.");
        }
        catch (NotFoundException)
        {
            return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
        }
    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/remove_reviewer/{reviewer}")]
    public async Task<ActionResult> removeReviewer(string owner, string repoName, long prnumber, string reviewer)
    {
        try
        {
            var reviewRequest = new PullRequestReviewRequest([reviewer], null);
            await GitHubUserClient.PullRequest.ReviewRequest.Delete(owner, repoName, (int)prnumber, reviewRequest);

            using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
            connection.Open();

            string query = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

            using (var command = new NpgsqlCommand(query, connection))
            {
                command.ExecuteNonQuery();
            }
            connection.Close();

            return Ok($"{reviewer} is removed from PR #{prnumber}.");
        }
        catch (NotFoundException)
        {
            return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
        }
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addComment")]
    public async Task<ActionResult> AddCommentToPR(string owner, string repoName, int prnumber, [FromBody] string commentBody)
    {
        string decorated_body = $"<!--Using HubReview-->**ACTIVE**: {commentBody}";
        var comment = await GitHubUserClient.Issue.Comment.Create(owner, repoName, prnumber, decorated_body);

        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
        connection.Open();

        string query = $"INSERT INTO comments VALUES ({comment.Id}, '{repoName}', {prnumber}, {false}, '', '', 'ACTIVE')";
        using (var command = new NpgsqlCommand(query, connection))
        {
            command.ExecuteNonQuery();
        }

        string query1 = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

        using (var command = new NpgsqlCommand(query1, connection))
        {
            command.ExecuteNonQuery();
        }

        connection.Close();

        return Ok($"Comment added to pull request #{prnumber} in repository {repoName}.");
    }

    [HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateCommentStatus")]
    public async Task<ActionResult> UpdateStatus(string owner, string repoName, int comment_id, [FromBody] string status)
    {
        bool is_review = false;
        int prnumber = 0;
        Octokit.PullRequestReviewComment? res1 = null;
        Octokit.IssueComment? res2 = null;

        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
        connection.Open();

        string select = $"SELECT is_review, prnumber FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
            prnumber = reader.GetInt32(1);
        }

        reader.Close();
        connection.Close();

        if (is_review)
        {
            var comment = await GitHubUserClient.PullRequest.ReviewComment.GetComment(owner, repoName, comment_id);
            string new_body = $"<!--Using HubReview-->**{status}** {comment.Body[comment.Body.IndexOf('\n')..]}";
            res1 = await GitHubUserClient.PullRequest.ReviewComment.Edit(owner, repoName, comment_id, new PullRequestReviewCommentEdit(new_body));
        }
        else
        {
            var comment = await GitHubUserClient.Issue.Comment.Get(owner, repoName, comment_id);
            string new_body = $"<!--Using HubReview-->**{status}**: {comment.Body[(comment.Body.IndexOf(':') + 2)..]}";
            res2 = await GitHubUserClient.Issue.Comment.Update(owner, repoName, comment_id, new_body);

            if (status == "RESOLVED")
            {
                var arg = new MinimizeCommentInput
                {
                    SubjectId = new ID(res2.NodeId),
                    Classifier = ReportedContentClassifiers.Resolved,
                    ClientMutationId = "hubreviewapp"
                };

                var mutation = new Mutation()
                                .MinimizeComment(arg)
                                .Select(x => new { x.MinimizedComment.IsMinimized });

                await GitHubUserGraphQLConnection.Run(mutation);
            }

            if (status == "ACTIVE")
            {
                var arg = new UnminimizeCommentInput
                {
                    SubjectId = new ID(res2.NodeId),
                    ClientMutationId = "hubreviewapp"
                };

                var mutation = new Mutation()
                                .UnminimizeComment(arg)
                                .Select(x => new { x.UnminimizedComment.IsMinimized });

                await GitHubUserGraphQLConnection.Run(mutation);

            }

        }

        connection.Open();

        string query = $"UPDATE comments SET status = '{status}' where commentid = {comment_id}";
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }

        string query1 = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

        using (var command2 = new NpgsqlCommand(query1, connection))
        {
            command.ExecuteNonQuery();
        }

        connection.Close();

        return (res1 == null) ? Ok(res2) : Ok(res1);
    }

    [HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateComment")]
    public async Task<ActionResult> UpdateComment(string owner, string repoName, int comment_id, [FromBody] string body)
    {
        bool is_review = false;
        int prnumber = 0;
        Octokit.PullRequestReviewComment? res1 = null;
        Octokit.IssueComment? res2 = null;

        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
        connection.Open();

        string select = $"SELECT is_review, prnumber FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
            prnumber = reader.GetInt32(1);
        }
        connection.Close();

        if (is_review)
        {
            var comment = await GitHubUserClient.PullRequest.ReviewComment.GetComment(owner, repoName, comment_id);
            var before_colon = comment.Body[..(comment.Body.IndexOf(':') + 2)];
            string new_body = before_colon + body;
            res1 = await GitHubUserClient.PullRequest.ReviewComment.Edit(owner, repoName, comment_id, new PullRequestReviewCommentEdit(body = new_body));
        }
        else
        {
            var comment = await GitHubUserClient.Issue.Comment.Get(owner, repoName, comment_id);

            long replyId = 0;
            string before = "";
            string new_body = "";

            if (comment.Body.Contains("#issuecomment-"))
            {
                int index = comment.Body.IndexOf("#issuecomment-");
                replyId = long.Parse(comment.Body.Substring(index + 14, 10));
                before = comment.Body[..(comment.Body.IndexOf(replyId.ToString()) + 11)];
                new_body = before + "\n\n" + body;
            }
            else
            {
                before = comment.Body[..(comment.Body.IndexOf(':') + 2)];
                new_body = before + body;
            }

            res2 = await GitHubUserClient.Issue.Comment.Update(owner, repoName, comment_id, new_body);

        }

        connection.Open();
        string query = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }
        connection.Close();

        return (res1 == null) ? Ok(res2) : Ok(res1);
    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
    public async Task<ActionResult> DeleteComment(string owner, string repoName, int comment_id)
    {
        bool is_review = false;
        int prnumber = 0;

        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
        connection.Open();

        string select = $"SELECT is_review, prnumber FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
            prnumber = reader.GetInt32(1);
        }

        reader.Close();
        connection.Close();

        if (is_review)
        {
            await GitHubUserClient.PullRequest.ReviewComment.Delete(owner, repoName, comment_id);
        }
        else
        {
            await GitHubUserClient.Issue.Comment.Delete(owner, repoName, comment_id);
        }

        connection.Open();

        string query = $"DELETE FROM comments WHERE commentid = {comment_id}";
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }

        string query2 = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";
        using (var command2 = new NpgsqlCommand(query2, connection))
        {
            command2.ExecuteNonQuery();
        }

        connection.Close();

        return Ok($"Comment deleted.");
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
    public async Task<ActionResult> getCommentsOnPR(string owner, string repoName, int prnumber)
    {
        var result = new List<IssueCommentInfo>([]);
        var processedCommentIds = new HashSet<long>();

        using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);

        var comments = await GitHubUserClient.Issue.Comment.GetAllForIssue(owner, repoName, prnumber);

        foreach (var comm in comments)
        {
            if (!processedCommentIds.Contains(comm.Id))
            {
                long replyId = 0;

                if (comm.Body.Contains("#issuecomment-"))
                {
                    int index = comm.Body.LastIndexOf("#issuecomment-");
                    replyId = long.Parse(comm.Body.Substring(index + 14, 10));
                }

                if (!comm.Body.Contains("<!--Using HubReview-->"))
                {
                    var commentObj = new IssueCommentInfo
                    {
                        id = comm.Id,
                        author = comm.User.Login,
                        avatar = comm.User.AvatarUrl,
                        body = comm.Body,
                        label = null,
                        decoration = null,
                        createdAt = comm.CreatedAt,
                        updatedAt = comm.UpdatedAt,
                        association = comm.AuthorAssociation.StringValue,
                        url = comm.HtmlUrl,
                        replyToId = (replyId == 0) ? null : replyId
                    };

                    result.Add(commentObj);
                }
                else
                {
                    int index = (replyId == 0) ? comm.Body.IndexOf(':') : comm.Body.LastIndexOf("\n\n");
                    string parsed_message = (replyId == 0) ? comm.Body[(index + 2)..] : comm.Body[(index + 1)..];

                    await connection.OpenAsync();
                    string query = $"SELECT label, decoration, status FROM comments WHERE commentid = {comm.Id}";
                    var command = new NpgsqlCommand(query, connection);
                    NpgsqlDataReader reader = await command.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var commentObj = new IssueCommentInfo
                        {
                            id = comm.Id,
                            author = comm.User.Login,
                            avatar = comm.User.AvatarUrl,
                            body = parsed_message,
                            label = reader.IsDBNull(0) ? null : reader.GetString(0),
                            decoration = reader.IsDBNull(1) ? null : reader.GetString(1),
                            status = reader.IsDBNull(2) ? null : reader.GetString(2),
                            createdAt = comm.CreatedAt,
                            updatedAt = comm.UpdatedAt,
                            association = comm.AuthorAssociation.StringValue,
                            url = comm.HtmlUrl,
                            replyToId = (replyId == 0) ? null : replyId
                        };

                        result.Add(commentObj);
                    }

                    await connection.CloseAsync();
                }

                processedCommentIds.Add(comm.Id);
            }
        }

        return Ok(result);
    }

    [HttpGet("pullrequests/{owner}/{repoName}/{prNumber}/reviews")]
    public async Task<ActionResult> GetPullRequestReviews(string owner, string repoName, int prNumber)
    {
        var reviews = await GitHubUserClient.PullRequest.Review.GetAll(owner, repoName, prNumber);
        var reviewComments = await GitHubUserClient.PullRequest.ReviewComment.GetAll(owner, repoName, prNumber);
        var publishedReviewComments = reviewComments.Where(rc => rc.PullRequestReviewId is not null).ToList();
        var reviewCommentDict = publishedReviewComments
            .GroupBy(rc => (long)rc.PullRequestReviewId!)
            .ToDictionary(g => g.Key, g => g.ToList());

        var reviewsWithComments = reviews.Select(review =>
            new
            {
                mainComment = review,
                childComments = reviewCommentDict.TryGetValue(review.Id, out var reviewComments) ? reviewComments : []
            }
        );

        var query = new Query()
            .Repository(Var("repoName"), Var("owner"))
            .PullRequest(Var("prNumber"))
            .ReviewThreads()
            .AllPages()
            .Select(rt => new
            {
                rt.Id,
                rt.IsResolved,
                TopCommentId = rt.Comments(1, null, null, null, null).Nodes.Select(c => c.Id).ToList().Single(),
            })
            .Compile();

        var reviewThreads = await GitHubUserGraphQLConnection.Run(query, new Dictionary<string, object>
        {
            { "owner", owner },
            { "repoName", repoName },
            { "prNumber", prNumber },
        });
        var resolvedTopCommentNodeIds = reviewThreads.Where(rt => rt.IsResolved).Select(rt => rt.TopCommentId).ToArray();

        return Ok(new { Reviews = reviewsWithComments, ResolvedTopCommentNodeIds = resolvedTopCommentNodeIds });
    }

    [HttpPost("pullrequests/{owner}/{repoName}/{prnumber}/reviews")]
    public async Task<ActionResult> CreatePullRequestReview(string owner, string repoName, int prnumber, [FromBody] CreateReviewRequestModel req)
    {
        var rev = new PullRequestReviewCreate()
        {
            //CommitId = sha, // TODO: Ideally this'd be used, but it's not straightforward to pull PR files with commit ID attached... Maybe GraphQL needed?
            Body = req.body,
            Event = req.verdict switch
            {
                "approve" => Octokit.PullRequestReviewEvent.Approve,
                "reject" => Octokit.PullRequestReviewEvent.RequestChanges,
                "comment" => Octokit.PullRequestReviewEvent.Comment,
                _ => throw new ArgumentOutOfRangeException(nameof(req.verdict), $"Can't map '{req.verdict}'")
            },
            Comments = req.comments?.Select(comment =>
            {
                var conventionalBody = $"<!--Using HubReview-->\n{comment.label?.ToLower()}({comment.decoration}): {comment.message}";
                var draft = new Octokit.DraftPullRequestReviewComment(conventionalBody, comment.filename, comment.position);
                return draft;
            }).ToList() ?? [],
        };

        var review = await GitHubUserClient.PullRequest.Review.Create(owner, repoName, prnumber, rev);

        if (review == null)
        {
            return Problem("Review can not be created.");
        }

        return Ok($"Review added to pull request #{prnumber} in repository {repoName}.");
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addCommentReply")]
    public async Task<ActionResult> AddCommentReply(string owner, string repoName, int prnumber, [FromBody] CreateReplyRequestModel req)
    {
        var replied_to = await GitHubUserClient.Issue.Comment.Get(owner, repoName, req.replyToId);

        string decorated_body = replied_to.Body.Contains("<!--Using HubReview-->") ? $"<!--Using HubReview-->\n> {replied_to.Body.Remove(0, 22)}\n> {replied_to.HtmlUrl} \n\n{req.body}" : $"<!--Using HubReview-->\n> {replied_to.Body}\n> {replied_to.HtmlUrl} \n\n{req.body}";

        var comment = await GitHubUserClient.Issue.Comment.Create(owner, repoName, prnumber, decorated_body);

        await using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
        await connection.OpenAsync();

        await connection.ExecuteScalarAsync(
            @"INSERT INTO comments (commentid, reponame, prnumber, is_review)
            VALUES (@CommentId, @RepoName, @PRNumber, @IsReview)",
            new
            {
                CommentId = comment.Id,
                RepoName = repoName,
                PRNumber = prnumber,
                IsReview = false
            });

        return Ok(comment);
    }

    [HttpPost("pullrequests/{owner}/{repoName}/{prNumber}/reviews/comments/{topCommentId}/replies")]
    public async Task<ActionResult> ReplyToPullRequestThread(string owner, string repoName, int prNumber, int topCommentId, [FromBody] CreateReviewThreadReplyRequestModel req)
    {
        var response = await GitHubUserClient.PullRequest.ReviewComment.CreateReply(owner, repoName, prNumber, new PullRequestReviewCommentReplyCreate(req.body, topCommentId));

        return Ok(response);
    }

    [HttpPost("pullrequests/{owner}/{repoName}/{prNumber}/reviews/comments/{commentNodeId}/toggleResolution")]
    public async Task<ActionResult> TogglePullRequestReviewCommentResolution(string owner, string repoName, int prNumber, string commentNodeId)
    {
        var query = new Query()
            .Repository(Var("repoName"), Var("owner"))
            .PullRequest(Var("prNumber"))
            .ReviewThreads(first: 50)
            .Nodes
            .Select(rt => new
            {
                rt.Id,
                rt.IsResolved,
                TopCommentId = rt.Comments(1, null, null, null, null).Nodes.Select(c => c.Id).ToList().Single(),
            })
            .Compile();

        var reviewThreads = await GitHubUserGraphQLConnection.Run(query, new Dictionary<string, object>
        {
            { "owner", owner },
            { "repoName", repoName },
            { "prNumber", prNumber },
        });

        var thread = reviewThreads.Where(rt => rt.TopCommentId.Value == commentNodeId).Single();

        if (thread.IsResolved)
        {
            var mutation = new Mutation()
                .UnresolveReviewThread(new UnresolveReviewThreadInput()
                {
                    ClientMutationId = "hubreviewapp",
                    ThreadId = thread.Id,
                })
                .Select(p => p.ClientMutationId);
            var result = await GitHubUserGraphQLConnection.Run(mutation);
        }
        else
        {
            var mutation = new Mutation()
                .ResolveReviewThread(new ResolveReviewThreadInput()
                {
                    ClientMutationId = "hubreviewapp",
                    ThreadId = thread.Id,
                })
                .Select(p => p.ClientMutationId);
            var result = await GitHubUserGraphQLConnection.Run(mutation);
        }

        return Ok();
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_commits")]
    public async Task<ActionResult> getCommits(string owner, string repoName, int prnumber)
    {
        var processedCommitIds = new HashSet<string>();
        var result = new List<CommitsList>([]);
        string link = "https://github.com/" + owner + "/" + repoName + "/pull/" + prnumber + "/commits/";

        var commits = await GitHubUserClient.PullRequest.Commits(owner, repoName, prnumber);

        CommitInfo obj;

        foreach (var commit in commits)
        {
            if (processedCommitIds.Contains(commit.NodeId))
            {
                continue;
            }

            bool dateExists = result.Any(temp => temp.date == commit.Commit.Author.Date.ToString("yyyy/MM/dd"));

            if (!dateExists)
            {
                result.Add(new CommitsList
                {
                    date = commit.Commit.Author.Date.ToString("yyyy/MM/dd"),
                    commits = []
                });
            }

            int indexOfDate = result.FindIndex(temp => temp.date == commit.Commit.Author.Date.ToString("yyyy/MM/dd"));

            if (commit.Commit.Message.Contains('\n'))
            {
                string split_here = "\n\n";
                string[] message = commit.Commit.Message.Split(split_here);
                obj = new CommitInfo
                {
                    title = message[0],
                    description = message[1],
                    author = commit.Author.Login,
                    avatarUrl = commit.Author.AvatarUrl,
                    githubLink = link + commit.Sha,
                    sha = commit.Sha
                };

            }
            else
            {
                obj = new CommitInfo
                {
                    title = commit.Commit.Message,
                    description = null,
                    author = commit.Author.Login,
                    avatarUrl = commit.Author.AvatarUrl,
                    githubLink = link + commit.Sha,
                    sha = commit.Sha
                };
            }

            result[indexOfDate].commits?.Add(obj);

            processedCommitIds.Add(commit.NodeId);
        }

        return Ok(result);
    }

    [HttpGet("commit/{owner}/{repoName}/{prnumber}/{sha}/get_patches")]
    public async Task<ActionResult> getDiffs(string owner, string repoName, int prnumber, string sha)
    {
        var result = new List<object>([]);

        var commit = await GitHubUserClient.Repository.Commit.Get(owner, repoName, sha);
        foreach (var file in commit.Files)
        {
            var fileContent = await GitHubUserClient.Repository.Content.GetAllContentsByRef(owner, repoName, file.Filename, sha);
            result.Add(new
            {
                name = file.Filename,
                status = file.Status,
                sha = file.Sha,
                adds = file.Additions,
                dels = file.Deletions,
                changes = file.Changes,
                content = file.Patch
            });
        }

        return Ok(result);
    }

    [HttpGet("pullrequests/{owner}/{repoName}/{prnumber}/files")]
    public async Task<ActionResult> getAllPatches(string owner, string repoName, int prnumber)
    {
        var files = await GitHubUserClient.PullRequest.Files(owner, repoName, prnumber);
        var result = files.Select(file => new
        {
            name = file.FileName,
            status = file.Status,
            sha = file.Sha,
            adds = file.Additions,
            dels = file.Deletions,
            changes = file.Changes,
            content = file.Patch
        });

        return Ok(result);
    }

    [HttpGet("getPRReviewerSuggestion/{owner}/{repoName}/{prOwner}")]
    public async Task<ActionResult> getPRReviewerSuggestion(string owner, string repoName, string prOwner)
    {
        if (UserLogin == "HubReview-tester" && repoName == "hubreview")
        {
            List<object> res = new List<object>
            {
                new {
                    Id = 12011884,
                    Login = "vedxyz",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/12011884?v=4",
                    CurrentLoad = 10,
                    MaxLoad = 10
                },
                new {
                    Id = 63541299,
                    Login = "Ece-Kahraman",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/63541299?v=4",
                    CurrentLoad = 4,
                    MaxLoad = 10
                },
                new {
                    Id = 67067747,
                    Login = "vIremAydin",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/67067747?v=4",
                    CurrentLoad = 6,
                    MaxLoad = 10
                },
                new {
                    Id = 70059998,
                    Login = "aysekelleci",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/70059998?v=4",
                    CurrentLoad = 2,
                    MaxLoad = 10
                },
                new {
                    Id = 72230736,
                    Login = "AlperMumcular",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/72230736?v=4",
                    CurrentLoad = 3,
                    MaxLoad = 10
                },
                new {
                    Id = 167875568,
                    Login = "HubReview-tester",
                    AvatarUrl = "https://avatars.githubusercontent.com/u/167875568?v=4",
                    CurrentLoad = 1,
                    MaxLoad = 10
                }
            };
            return Ok(res);
        }

        var result = new List<object>();

        try
        {
            var collaborators = await GitHubUserClient.Repository.Collaborator.GetAll(owner, repoName);

            foreach (var collaborator in collaborators)
            {
                if (collaborator.Login == prOwner)
                    continue; // Skip the pr owner

                var userLoads = await GetUserWorkload(collaborator.Login);
                result.Add(new
                {
                    Id = collaborator.Id,
                    Login = collaborator.Login,
                    AvatarUrl = collaborator.AvatarUrl,
                    currentLoad = userLoads.currentLoad,
                    maxLoad = userLoads.maxLoad
                });
            }

            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound($"Repository {repoName} not found under owner {owner}.");
        }
    }

    [HttpGet("user/{userName}/workload")]
    public async Task<Workload> GetUserWorkload(string userName)
    {
        long result;
        int maxWorkload = 10;

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = @"
                SELECT COUNT(*) AS total_workload                
                FROM pullrequestinfo
                WHERE state = 'open'
                AND @userName = ANY(reviewers)
            ";

            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@userName", userName);

                result = (long)await command.ExecuteScalarAsync();
            }

            query = @"SELECT workload FROM userinfo where @userName = login";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@userName", userName);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        maxWorkload = reader.GetInt32(0);
                    }
                }
            }

            await connection.CloseAsync();
        }

        var workload = new Workload
        {
            currentLoad = result,
            maxLoad = maxWorkload
        };

        return workload;
    }

    [HttpPost("user/{userLogin}/workload")]
    public async Task<ActionResult> SetUserWorkload(string userLogin, [FromBody] int workload)
    {
        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = $@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM userinfo WHERE login = '{userLogin}') THEN
                        UPDATE userinfo SET workload = {workload} WHERE login = '{userLogin}';
                    ELSE
                        INSERT INTO userinfo (login, workload) VALUES ('{userLogin}', {workload});
                    END IF;
                END $$;
            ";

            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                await command.ExecuteScalarAsync();
            }

            await connection.CloseAsync();
        }
        return Ok("Workload successfully updated.");
    }

    [HttpGet("getRepoLabels/{owner}/{repoName}")]
    public async Task<ActionResult> GetRepoLabels(string owner, string repoName)
    {
        var result = new List<LabelInfo>();

        try
        {
            var labels = await GitHubUserClient.Issue.Labels.GetAllForRepository(owner, repoName);

            foreach (var label in labels)
            {
                result.Add(new LabelInfo
                {
                    id = label.Id,
                    name = label.Name,
                    color = label.Color
                });
            }

            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound($"Repository {repoName} not found under owner {owner}.");
        }
    }

    [HttpGet("getRepoAssignees/{owner}/{repoName}")]
    public async Task<ActionResult> GetRepoAssignees(string owner, string repoName)
    {
        var result = new List<AssigneeInfo>();

        try
        {
            var assignees = await GitHubUserClient.Repository.Collaborator.GetAll(owner, repoName);

            foreach (var assignee in assignees)
            {
                result.Add(new AssigneeInfo
                {
                    id = assignee.Id,
                    login = assignee.Login,
                    avatarUrl = assignee.AvatarUrl,
                    url = assignee.Url
                });
            }

            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound($"Repository {repoName} not found under owner {owner}.");
        }
    }

    [HttpGet("GetReviewerSuggestions/{owner}/{repoName}/{prNumber}")]
    public async Task<ActionResult> GetReviewerSuggestions(string owner, string repoName, int prNumber)
    {
        List<string> suggestedReviewersList = new List<string>();
        var query = new Query()
            .RepositoryOwner(Var("owner"))
            .Repository(Var("name"))
            .PullRequest(Var("prnumber"))
            .Select(pr => new
            {
                pr.Number,
                pr.Title,
                SuggestedReviewers = pr.SuggestedReviewers.Select(reviewer => new
                {
                    Login = reviewer.Reviewer.Login,
                    avatarUrl = reviewer.Reviewer.Url + ".png",
                }).ToList(),
            }).Compile();

        var vars = new Dictionary<string, object>
        {
            { "owner", owner },
            { "name", repoName },
            { "prnumber", prNumber },
        };

        var result = await GitHubUserGraphQLConnection.Run(query, vars);

        foreach (var suggestedReviewer in result.SuggestedReviewers)
        {
            suggestedReviewersList.Add(suggestedReviewer.Login);
        }
        // FIXME: why isn't this returning `suggestedReviewersList`?
        return Ok(result.SuggestedReviewers);
    }

    [HttpPost("prs/needsreview/filter")]
    public async Task<ActionResult> FilterNeedsYourReviewPRs([FromBody] PRFilter filter)
    {
        List<object> allPRs = [];

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND @ownerLogin = ANY(reviewers)";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }
            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }

            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        // Handle unsupported date filter value
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }

            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }

            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repositories", filter.repositories);
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }
                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpPost("prs/userprs/filter")]
    public async Task<ActionResult> FilterUserPRs([FromBody] PRFilter filter)
    {
        List<object> allPRs = [];

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND author = @ownerLogin";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }
            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }
            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        // Handle unsupported date filter value
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }
            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }
            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repositories", filter.repositories);
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }

                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };


                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpPost("prs/waitingauthor/filter")]
    public async Task<ActionResult> FilterWaitingAuthors([FromBody] PRFilter filter)
    {
        List<object> allPRs = new List<object>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE ( NOT @ownerLogin = ANY(reviewers) AND EXISTS ( SELECT 1 FROM json_array_elements(reviews) AS review WHERE review->>'login' = @ownerLogin) ) AND state='open' AND @ownerLogin != author AND repoid = ANY(@repos)";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }
            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }
            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }
            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }

            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }

            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@repositories", filter.repositories);
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }

                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };


                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpPost("prs/open/filter")]
    public async Task<ActionResult> FilterOpenPRs([FromBody] PRFilter filter)
    {
        List<object> allPRs = [];

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND repoid = ANY(@repos)";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }

            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }
            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        // Handle unsupported date filter value
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }
            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }
            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@repositories", filter.repositories);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }

                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpPost("prs/merged/filter")]
    public async Task<ActionResult> FilterMergedPRs([FromBody] PRFilter filter)
    {

        List<object> allPRs = new List<object>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'closed' AND merged = true AND repoid = ANY(@repos)";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }
            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }
            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        // Handle unsupported date filter value
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }
            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }
            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@repositories", filter.repositories);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }

                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };


                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpPost("prs/closed/filter")]
    public async Task<ActionResult> FilterClosedPRs([FromBody] PRFilter filter)
    {
        List<object> allPRs = new List<object>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        if (filter.repositories == null)
        {
            return Ok(allPRs);
        }

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'closed' AND merged = false AND repoid = ANY(@repos)";
            if (!string.IsNullOrEmpty(filter.author))
            {
                query += " AND author = '" + filter.author + "'";
            }
            if (!string.IsNullOrEmpty(filter.assignee))
            {
                query += " AND '" + filter.assignee + "' = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.priority))
            {
                query += " AND priority = " + filter.priority;
            }
            if (filter.labels != null && filter.labels.Length > 0)
            {
                query += " AND EXISTS (SELECT 1 FROM json_array_elements(labels) AS label WHERE label->>'name' IN (";
                for (int i = 0; i < filter.labels.Length; i++)
                {
                    query += "'" + filter.labels[i] + "'";
                    if (i < filter.labels.Length - 1)
                    {
                        query += ", ";
                    }
                }
                query += "))";
            }
            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.fromDate))
            {
                switch (filter.fromDate.ToLower())
                {
                    case "today":
                        query += " AND createdat >= CURRENT_DATE AND createdat < CURRENT_DATE + INTERVAL '1 day'";
                        break;
                    case "thisweek":
                        query += " AND createdat >= date_trunc('week', CURRENT_DATE) AND createdat < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week'";
                        break;
                    case "thismonth":
                        query += " AND createdat >= date_trunc('month', CURRENT_DATE) AND createdat < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'";
                        break;
                    case "thisyear":
                        query += " AND createdat >= date_trunc('year', CURRENT_DATE) AND createdat < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'";
                        break;
                    default:
                        // Handle unsupported date filter value
                        query += " AND createdat >= '" + filter.fromDate + "'";
                        break;
                }
            }
            if (!string.IsNullOrEmpty(filter.name))
            {
                query += " AND title ILIKE '%" + filter.name + "%'";
            }
            if (!string.IsNullOrEmpty(filter.orderBy))
            {
                switch (filter.orderBy.ToLower())
                {
                    case "newest":
                        query += " ORDER BY createdat DESC";
                        break;
                    case "oldest":
                        query += " ORDER BY createdat ASC";
                        break;
                    case "priority":
                        query += " ORDER BY priority DESC";
                        break;
                    case "recentlyupdated":
                        query += " ORDER BY updatedat DESC";
                        break;
                        // Add more cases for other sorting options
                }
            }


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@repositories", filter.repositories);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        List<ReviewObjDB> combined_revs = [];
                        var reviews = JsonConvert.DeserializeObject<ReviewObjDB[]>(reader.GetString(20));
                        var reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray();

                        foreach (var obj in reviewers)
                        {
                            combined_revs.Add(new ReviewObjDB
                            {
                                login = obj,
                                state = "PENDING",
                                avatarUrl = "https://github.com/" + obj + ".png"
                            });
                        }

                        foreach (var name in reviews)
                        {
                            if (!reviewers.Contains(name.login))
                            {
                                combined_revs.Add(new ReviewObjDB
                                {
                                    login = name.login,
                                    state = name.state,
                                    avatarUrl = "https://github.com/" + name.login + ".png"
                                });
                            }
                        }

                        var pr = new
                        {
                            Id = reader.GetInt64(0),
                            Title = reader.GetString(1),
                            PRNumber = reader.GetInt32(2),
                            Author = reader.GetString(3),
                            AuthorAvatarURL = reader.GetString(4),
                            CreatedAt = reader.GetFieldValue<DateOnly>(5),
                            UpdatedAt = reader.GetFieldValue<DateOnly>(6),
                            RepoName = reader.GetString(7),
                            Additions = reader.GetInt32(8),
                            Deletions = reader.GetInt32(9),
                            Files = reader.GetInt32(10),
                            Comments = reader.GetInt32(11),
                            Labels = JsonConvert.DeserializeObject<object[]>(reader.GetString(12)),
                            RepoOwner = reader.GetString(13),
                            Checks = JsonConvert.DeserializeObject<object[]>(reader.GetString(14)),
                            ChecksComplete = reader.GetInt32(15),
                            ChecksIncomplete = reader.GetInt32(16),
                            ChecksSuccess = reader.GetInt32(17),
                            ChecksFail = reader.GetInt32(18),
                            Assignees = reader.IsDBNull(19) ? new string[] { } : ((object[])reader.GetValue(19)).Select(obj => obj.ToString()).ToArray(),
                            Reviews = combined_revs
                        };


                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return Ok(allPRs);
    }

    [HttpGet("user/weeklysummary")]
    public async Task<ActionResult> GetReviewsForUserInLastWeek()
    {
        List<PRInfo> allPRs = new List<PRInfo>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        var lastWeek = DateTime.Today.AddDays(-7);

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "pullnumber, reponame, repoowner";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE repoid = ANY(@repos) AND updatedat >= @lastWeek AND EXISTS (SELECT 1 FROM json_array_elements(reviews) AS elem WHERE elem->>'login' = @ownerLogin)";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@lastWeek", lastWeek);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
                        {
                            PRNumber = reader.GetInt32(0),
                            RepoName = reader.GetString(1),
                            RepoOwner = reader.GetString(2),
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        var reviewsLastWeek = new List<Octokit.PullRequestReview>();
        int submitted = 0;

        var allReviewsTasks = allPRs.Select(async pull =>
        {
            var reviews = await GitHubUserClient.PullRequest.Review.GetAll(pull.RepoOwner, pull.RepoName, (int)pull.PRNumber);

            foreach (var review in reviews)
            {
                if (review.User.Login == UserLogin && review.SubmittedAt >= lastWeek)
                {
                    reviewsLastWeek.Add(review);
                    submitted++;
                }
            }
        });
        await Task.WhenAll(allReviewsTasks);



        var requestedReviewsCount = await GetRequestedPRs((GitHubClient?)GitHubUserClient);

        var waitingReviewsCount = await GetWaitingReviews();

        // waiting --> o hafta yaratılmış ama henüz review edilmemiş olanlar (requested - submitted gibi)
        List<int> result = [submitted, requestedReviewsCount, waitingReviewsCount];

        return Ok(result);
    }

    public async Task<int> GetRequestedPRs(GitHubClient github)
    {
        List<PRInfo> allPRs = new List<PRInfo>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        var lastWeek = DateTime.Today.AddDays(-7);

        using (NpgsqlConnection conn = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await conn.OpenAsync();

            string selects = "pullnumber, reponame, repoowner";
            string q = "SELECT " + selects + " FROM pullrequestinfo WHERE repoid = ANY(@repos) AND updatedat >= @lastWeek";
            using (NpgsqlCommand command = new NpgsqlCommand(q, conn))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@lastWeek", lastWeek);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
                        {
                            PRNumber = reader.GetInt32(0),
                            RepoName = reader.GetString(1),
                            RepoOwner = reader.GetString(2),
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await conn.CloseAsync();
        }

        int requestedPRCount = 0;

        var allReviewsTasks = allPRs.Select(async pr =>
        {
            var query = new Query()
            .Repository(Var("name"), Var("owner"))
            .PullRequest(Var("prnumber"))
            .TimelineItems(null, null, 250, null, null, null, null)
            .Nodes
            .Select(node => node.Switch<object>(when => when
            .ReviewRequestedEvent(y => new
            {
                Actor = y.Actor.Select(actor => new
                {
                    AvatarUrl = actor.AvatarUrl(500),
                    Login = actor.Login,
                })
                .SingleOrDefault(),

                RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                {

                    User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                            .User(user => new Core.Entities.User
                            {
                                AvatarUrl = user.AvatarUrl(100),
                                Login = user.Login,
                            })),
                })
                .SingleOrDefault(),

                CreatedAt = y.CreatedAt,
            })
            )).Compile();


            var vars = new Dictionary<string, object>
            {
                { "owner", pr.RepoOwner },
                { "name", pr.RepoName },
                { "prnumber", pr.PRNumber },
            };

            var result = await GitHubUserGraphQLConnection.Run(query, vars);

            foreach (var node in result)
            {
                var reviewRequestedEvent = node as dynamic;
                var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                var user = requestedReviewer?.User?.Login;
                var created = reviewRequestedEvent?.CreatedAt;

                if (user == UserLogin && created >= lastWeek)
                {
                    requestedPRCount++;
                }
            }
        });
        await Task.WhenAll(allReviewsTasks);


        return requestedPRCount;
    }

    public async Task<int> GetWaitingReviews()
    {
        try
        {
            using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
            {
                await connection.OpenAsync();

                string query = "SELECT COUNT(*) FROM pullrequestinfo WHERE state = 'open' AND @ownerLogin = ANY(reviewers)";

                using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                {
                    ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                    command.Parameters.AddWithValue("@ownerLogin", UserLogin);

                    long waitingReviewsCount = (long)(await command.ExecuteScalarAsync() ?? 0);
                    return (int)waitingReviewsCount;

                }
            }
        }
        catch (Exception ex)
        {
            // Handle exceptions appropriately
            Console.WriteLine($"An error occurred: {ex.Message}");
            throw; // Rethrow the exception or handle it as necessary
        }
    }

    [HttpGet("user/monthlysummary")]
    public async Task<ActionResult> GetReviewsForUserInLastMonth()
    {
        if (UserLogin == "HubReview-tester")
        {
            List<object> array = [
                new
                {
                    Week = "2024-05-06 - 2024-05-12",
                    Submitted = 5,
                    Received = 3,
                    Speed = "00.12:45"
                },
                new
                {
                    Week = "2024-04-29 - 2024-05-05",
                    Submitted = 4,
                    Received = 5,
                    Speed = "00.16:15"
                },
                new
                {
                    Week = "2024-04-22 - 2024-04-28",
                    Submitted = 8,
                    Received = 6,
                    Speed = "01.09:37"
                },
                new
                {
                    Week = "2024-04-15 - 2024-04-21",
                    Submitted = 5,
                    Received = 5,
                    Speed = "01.00:20"
                },
            ];
            return Ok(array);
        }

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        var weeks = new List<(DateTime start, DateTime end)>();
        DateTime today = DateTime.Today;

        // Calculate the start and end dates for the last 4 weeks
        for (int i = 0; i < 4; i++)
        {
            DateTime startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1 - (i * 7)); // Start from Monday
            DateTime endOfWeek = startOfWeek.AddDays(6); // End on Sunday
            weeks.Add((startOfWeek, endOfWeek));
        }

        var reviewsThisWeek = new int[] { 0, 0, 0, 0 };

        var reviewsWithRequests = new int[] { 0, 0, 0, 0 };
        var timeBetweenRequestsAndReviews = new List<TimeSpan>(new TimeSpan[4]);

        List<PRInfo> allPRs = new List<PRInfo>();

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = "SELECT pullnumber, reponame, repoowner FROM pullrequestinfo WHERE repoid = ANY(@repos) AND updatedat >= @startOfWeek AND EXISTS (SELECT 1 FROM json_array_elements(reviews) AS elem WHERE elem->>'login' = @ownerLogin)";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@startOfWeek", weeks[3].start);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
                        {
                            PRNumber = reader.GetInt32(0),
                            RepoName = reader.GetString(1),
                            RepoOwner = reader.GetString(2),
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        var allReviewsTasks = allPRs.Select(async pull =>
        {
            var reviews = await GitHubUserClient.PullRequest.Review.GetAll(pull.RepoOwner, pull.RepoName, (int)pull.PRNumber);

            foreach (var review in reviews)
            {
                bool isMyUser = review.User.Login == UserLogin;
                if (isMyUser && review.SubmittedAt >= weeks[0].start && review.SubmittedAt <= weeks[0].end)
                {
                    reviewsThisWeek[0]++;
                    var query = new Query()
                    .Repository(Var("name"), Var("owner"))
                    .PullRequest(Var("prnumber"))
                    .TimelineItems(null, null, 250, null, null, null, null)
                    .Nodes
                    .Select(node => node.Switch<object>(when => when
                    .ReviewRequestedEvent(y => new
                    {
                        Actor = y.Actor.Select(actor => new
                        {
                            AvatarUrl = actor.AvatarUrl(500),
                            Login = actor.Login,
                        })
                        .SingleOrDefault(),

                        RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                        {

                            User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                                    .User(user => new Core.Entities.User
                                    {
                                        AvatarUrl = user.AvatarUrl(100),
                                        Login = user.Login,
                                    })),
                        })
                        .SingleOrDefault(),

                        CreatedAt = y.CreatedAt,
                    })
                    )).Compile();

                    var vars = new Dictionary<string, object>
                                {
                                    { "owner", pull.RepoOwner },
                                    { "name", pull.RepoName },
                                    { "prnumber", pull.PRNumber },
                                };

                    var result = await GitHubUserGraphQLConnection.Run(query, vars);

                    foreach (var node in result.Reverse())
                    {
                        var reviewRequestedEvent = node as dynamic;
                        var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                        var user = requestedReviewer?.User?.Login;
                        var created = reviewRequestedEvent?.CreatedAt;

                        bool isUser = user == UserLogin;
                        if (isUser && created <= review.SubmittedAt)
                        {
                            reviewsWithRequests[0]++;
                            var duration = review.SubmittedAt - created;
                            timeBetweenRequestsAndReviews[0] += duration;
                            break;
                        }
                    }
                }
                else if (isMyUser && review.SubmittedAt >= weeks[1].start && review.SubmittedAt <= weeks[1].end)
                {
                    reviewsThisWeek[1]++;

                    var query = new Query()
                    .Repository(Var("name"), Var("owner"))
                    .PullRequest(Var("prnumber"))
                    .TimelineItems(null, null, 250, null, null, null, null)
                    .Nodes
                    .Select(node => node.Switch<object>(when => when
                    .ReviewRequestedEvent(y => new
                    {
                        Actor = y.Actor.Select(actor => new
                        {
                            AvatarUrl = actor.AvatarUrl(500),
                            Login = actor.Login,
                        })
                        .SingleOrDefault(),

                        RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                        {

                            User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                                    .User(user => new Core.Entities.User
                                    {
                                        AvatarUrl = user.AvatarUrl(100),
                                        Login = user.Login,
                                    })),
                        })
                        .SingleOrDefault(),

                        CreatedAt = y.CreatedAt,
                    })
                    )).Compile();

                    var vars = new Dictionary<string, object>
                                {
                                    { "owner", pull.RepoOwner },
                                    { "name", pull.RepoName },
                                    { "prnumber", pull.PRNumber },
                                };

                    var result = await GitHubUserGraphQLConnection.Run(query, vars);

                    foreach (var node in result.Reverse())
                    {
                        var reviewRequestedEvent = node as dynamic;
                        var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                        var user = requestedReviewer?.User?.Login;
                        var created = reviewRequestedEvent?.CreatedAt;

                        bool isUser = user == UserLogin;
                        if (isUser && created <= review.SubmittedAt)
                        {
                            reviewsWithRequests[1]++;
                            var duration = review.SubmittedAt - created;
                            timeBetweenRequestsAndReviews[1] += duration;
                            break;
                        }
                    }
                }
                else if (isMyUser && review.SubmittedAt >= weeks[2].start && review.SubmittedAt <= weeks[2].end)
                {
                    reviewsThisWeek[2]++;

                    var query = new Query()
                    .Repository(Var("name"), Var("owner"))
                    .PullRequest(Var("prnumber"))
                    .TimelineItems(null, null, 250, null, null, null, null)
                    .Nodes
                    .Select(node => node.Switch<object>(when => when
                    .ReviewRequestedEvent(y => new
                    {
                        Actor = y.Actor.Select(actor => new
                        {
                            AvatarUrl = actor.AvatarUrl(500),
                            Login = actor.Login,
                        })
                        .SingleOrDefault(),

                        RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                        {

                            User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                                    .User(user => new Core.Entities.User
                                    {
                                        AvatarUrl = user.AvatarUrl(100),
                                        Name = user.Name,
                                        Login = user.Login,
                                    })),
                        })
                        .SingleOrDefault(),

                        CreatedAt = y.CreatedAt,
                    })
                    )).Compile();

                    var vars = new Dictionary<string, object>
                                {
                                    { "owner", pull.RepoOwner },
                                    { "name", pull.RepoName },
                                    { "prnumber", pull.PRNumber },
                                };

                    var result = await GitHubUserGraphQLConnection.Run(query, vars);

                    foreach (var node in result.Reverse())
                    {
                        var reviewRequestedEvent = node as dynamic;
                        var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                        var user = requestedReviewer?.User?.Login;
                        var created = reviewRequestedEvent?.CreatedAt;

                        bool isUser = user == UserLogin;
                        if (isUser && created <= review.SubmittedAt)
                        {
                            reviewsWithRequests[2]++;
                            var duration = review.SubmittedAt - created;
                            timeBetweenRequestsAndReviews[2] += duration;
                            break;
                        }
                    }
                }
                else if (isMyUser && review.SubmittedAt >= weeks[3].start && review.SubmittedAt <= weeks[3].end)
                {
                    reviewsThisWeek[3]++;

                    var query = new Query()
                    .Repository(Var("name"), Var("owner"))
                    .PullRequest(Var("prnumber"))
                    .TimelineItems(null, null, 250, null, null, null, null)
                    .Nodes
                    .Select(node => node.Switch<object>(when => when
                    .ReviewRequestedEvent(y => new
                    {
                        Actor = y.Actor.Select(actor => new
                        {
                            AvatarUrl = actor.AvatarUrl(500),
                            Login = actor.Login,
                        })
                        .SingleOrDefault(),

                        RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                        {

                            User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                                    .User(user => new Core.Entities.User
                                    {
                                        AvatarUrl = user.AvatarUrl(100),
                                        Login = user.Login,
                                    })),
                        })
                        .SingleOrDefault(),

                        CreatedAt = y.CreatedAt,
                    })
                    )).Compile();

                    var vars = new Dictionary<string, object>
                                {
                                    { "owner", pull.RepoOwner },
                                    { "name", pull.RepoName },
                                    { "prnumber", pull.PRNumber },
                                };

                    var result = await GitHubUserGraphQLConnection.Run(query, vars);

                    foreach (var node in result.Reverse())
                    {
                        var reviewRequestedEvent = node as dynamic;
                        var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                        var user = requestedReviewer?.User?.Login;
                        var created = reviewRequestedEvent?.CreatedAt;

                        bool isUser = user == UserLogin;
                        if (isUser && created <= review.SubmittedAt)
                        {
                            reviewsWithRequests[3]++;
                            var duration = review.SubmittedAt - created;
                            timeBetweenRequestsAndReviews[3] += duration;
                            break;
                        }
                    }
                }
            }
        });
        await Task.WhenAll(allReviewsTasks);

        var requestedReviewsCount = await GetMonthlyRequestedPRs((GitHubClient?)GitHubUserClient);

        var reviewSpeeds = new List<string>();

        var n = 0;
        foreach (var x in reviewsWithRequests)
        {
            if (x != 0)
            {
                var duration = timeBetweenRequestsAndReviews[n] / x;
                reviewSpeeds.Add(duration.ToString(@"dd\.hh\:mm"));
            }
            else
            {
                reviewSpeeds.Add("0.00:00");
            }
            n++;
        }

        var finalresult = new List<object>();

        for (int i = 0; i < 4; i++)
        {
            var weekSummary = new
            {
                Week = $"{weeks[i].start:yyyy-MM-dd} - {weeks[i].end:yyyy-MM-dd}",
                Submitted = reviewsThisWeek[i],
                Received = requestedReviewsCount[i],
                Speed = reviewSpeeds[i]
            };
            finalresult.Add(weekSummary);
        }

        return Ok(finalresult);
    }

    public async Task<int[]> GetMonthlyRequestedPRs(GitHubClient github)
    {
        List<PRInfo> allPRs = new List<PRInfo>();

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        var weeks = new List<(DateTime start, DateTime end)>();
        DateTime today = DateTime.Today;

        // Calculate the start and end dates for the last 4 weeks
        for (int i = 0; i < 4; i++)
        {
            DateTime startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1 - (i * 7)); // Start from Monday
            DateTime endOfWeek = startOfWeek.AddDays(6); // End on Sunday
            weeks.Add((startOfWeek, endOfWeek));
        }

        using (NpgsqlConnection conn = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await conn.OpenAsync();

            string selects = "pullnumber, reponame, repoowner";
            string q = "SELECT " + selects + " FROM pullrequestinfo WHERE repoid = ANY(@repos) AND updatedat >= @lastWeek";
            using (NpgsqlCommand command = new NpgsqlCommand(q, conn))
            {
                ArgumentNullException.ThrowIfNullOrWhiteSpace(UserLogin);
                command.Parameters.AddWithValue("@ownerLogin", UserLogin);
                command.Parameters.AddWithValue("@repos", repos);
                command.Parameters.AddWithValue("@lastWeek", weeks[3].start);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
                        {
                            PRNumber = reader.GetInt32(0),
                            RepoName = reader.GetString(1),
                            RepoOwner = reader.GetString(2),
                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await conn.CloseAsync();
        }

        var requestedThisWeek = new int[] { 0, 0, 0, 0 };


        var allReviewsTasks = allPRs.Select(async pr =>
        {
            var query = new Query()
            .Repository(Var("name"), Var("owner"))
            .PullRequest(Var("prnumber"))
            .TimelineItems(null, null, 250, null, null, null, null)
            .Nodes
            .Select(node => node.Switch<object>(when => when
            .ReviewRequestedEvent(y => new
            {
                Actor = y.Actor.Select(actor => new
                {
                    AvatarUrl = actor.AvatarUrl(500),
                    Login = actor.Login,
                })
                .SingleOrDefault(),

                RequestedReviewer = y.RequestedReviewer.Select(reviewer => new
                {

                    User = reviewer.Switch<Core.Entities.User>(whenUser => whenUser
                            .User(user => new Core.Entities.User
                            {
                                AvatarUrl = user.AvatarUrl(100),
                                Login = user.Login,
                            })),
                })
                .SingleOrDefault(),

                CreatedAt = y.CreatedAt,
            })
            )).Compile();


            var vars = new Dictionary<string, object>
            {
                { "owner", pr.RepoOwner },
                { "name", pr.RepoName },
                { "prnumber", pr.PRNumber },
            };

            var result = await GitHubUserGraphQLConnection.Run(query, vars);



            foreach (var node in result)
            {
                var reviewRequestedEvent = node as dynamic;
                var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                var user = requestedReviewer?.User?.Login;
                var created = reviewRequestedEvent?.CreatedAt;

                bool isMyUser = user == UserLogin;
                if (isMyUser && created >= weeks[0].start && created <= weeks[0].end)
                {
                    requestedThisWeek[0]++;
                }
                else if (isMyUser && created >= weeks[1].start && created <= weeks[1].end)
                {
                    requestedThisWeek[1]++;
                }
                else if (isMyUser && created >= weeks[2].start && created <= weeks[2].end)
                {
                    requestedThisWeek[2]++;
                }
                else if (isMyUser && created >= weeks[3].start && created <= weeks[3].end)
                {
                    requestedThisWeek[3]++;
                }
            }
        });
        await Task.WhenAll(allReviewsTasks);

        return requestedThisWeek;
    }

    [HttpGet("GetFilterLists")]
    public async Task<ActionResult> GetRepositoryAssignees()
    {
        var repos = (await GitHubUserClient.Repository.GetAllForCurrent()).Select(repo => repo.Id).ToList();

        HashSet<string> allAssignees = new HashSet<string>();
        HashSet<string> allLabels = new HashSet<string>();
        HashSet<string> allAuthors = new HashSet<string>();
        List<RepoInfo> allRepos = new List<RepoInfo>();

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = "SELECT id, name, ownerLogin, created_at FROM repositoryinfo WHERE id = ANY(@repos) ORDER BY name ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@repos", repos);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        RepoInfo repo = new RepoInfo
                        {
                            Id = reader.GetInt64(0),
                            Name = reader.GetString(1),
                            OwnerLogin = reader.GetString(2),
                        };
                        allRepos.Add(repo);
                    }
                }
            }

            var labelTasks = allRepos.Select(async repo =>
            {
                try
                {
                    var labels = await GitHubUserClient.Issue.Labels.GetAllForRepository(repo.OwnerLogin, repo.Name);

                    foreach (var label in labels)
                    {
                        allLabels.Add(label.Name);
                    }
                }
                catch (NotFoundException)
                {

                }
            });

            await Task.WhenAll(labelTasks);

            string query2 = "SELECT DISTINCT author FROM pullrequestinfo WHERE repoid = ANY(@repos) ORDER BY author ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query2, connection))
            {
                command.Parameters.AddWithValue("@repos", repos);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        allAuthors.Add(reader.GetString(0));
                    }
                }
            }

            string query3 = "SELECT DISTINCT unnest(assignees) as assignee FROM pullrequestinfo WHERE repoid = ANY(@repos) ORDER BY assignee ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query3, connection))
            {
                command.Parameters.AddWithValue("@repos", repos);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        allAssignees.Add(reader.GetString(0));
                    }
                }
            }

            await connection.CloseAsync();
        }

        allLabels.ExceptWith(allLabels.Where(label => label.StartsWith("Priority:")));
        allLabels = allLabels.OrderBy(label => label).ToHashSet();

        var authorsWithAvatars = allAuthors.Select(author => new { Login = author, AvatarUrl = $"https://github.com/{author}.png" });
        var assigneesWithAvatars = allAssignees.Select(assignee => new { Login = assignee, AvatarUrl = $"https://github.com/{assignee}.png" });

        return Ok(new { Authors = authorsWithAvatars, Labels = allLabels, Assignees = assigneesWithAvatars });
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/merge")]
    public async Task<ActionResult> MergePullRequest(string owner, string repoName, int prnumber)
    {
        try
        {

            var pullRequest = await GitHubUserClient.PullRequest.Get(owner, repoName, prnumber);

            await GitHubUserClient.PullRequest.Merge(owner, repoName, prnumber, new MergePullRequest());

            var branchToDelete = $"refs/heads/{pullRequest.Head.Ref}";
            await GitHubUserClient.Git.Reference.Delete(owner, repoName, branchToDelete);
            Console.WriteLine($"{owner} {repoName} {prnumber} is merged, and branch {branchToDelete} is deleted.");
            return Ok();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An error occurred while merging the pull request: {ex.Message}");
            throw; // Rethrow the exception or handle it as necessary
        }
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addAssignees")]
    public async Task<ActionResult> AddAssigneesToPR(string owner, string repoName, long prnumber, [FromBody] AssigneesRequest assigneesRequest)
    {
        try
        {
            await GitHubUserClient.Issue.Assignee.AddAssignees(owner, repoName, (int)prnumber, new AssigneesUpdate(assigneesRequest.assignees));
        }
        catch (Exception)
        {
            return Ok("Assignee(s) could not be added.");
        }
        return Ok("Assignee(s) are added.");
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/removeAssignees")]
    public async Task<ActionResult> RemoveAssigneesFromPR(string owner, string repoName, long prnumber, [FromBody] AssigneesRequest assigneesRequest)
    {
        try
        {
            await GitHubUserClient.Issue.Assignee.RemoveAssignees(owner, repoName, (int)prnumber, new AssigneesUpdate(assigneesRequest.assignees));
        }
        catch (Exception)
        {
            return Ok("Assignee(s) could not be removed.");
        }
        return Ok("Assignee(s) are removed.");
    }

    [HttpGet("user/savedreplies")]
    public async Task<ActionResult> GetUserSavedReplies()
    {
        var query = new Query()
            .User(_httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"))
            .SavedReplies(100, null, null, null, null)
            .Nodes
            .Select(reply => new
            {
                reply.Body,
                reply.Title,
            })
            .Compile();

        var response = await GitHubUserGraphQLConnection.Run(query);

        return Ok(response);
    }

    [HttpGet("user/weeklypulls")]
    public async Task<ActionResult> GetWeeklyPulls()
    {

        List<(int pullnumber, long repoid)> pulls = [];

        int open = 0, closed = 0, merged = 0;

        var repos = GitHubUserClient.Repository.GetAllForCurrent().Result.Select(repo => repo.Id).ToList();

        var lastWeek = DateTime.Today.AddDays(-7);

        var query = $@"SELECT
            COUNT(CASE WHEN state = 'open' THEN 1 END) AS open_count,
            COUNT(CASE WHEN state = 'closed' AND merged = FALSE THEN 1 END) AS closed_unmerged_count,
            COUNT(CASE WHEN state = 'closed' AND merged = TRUE THEN 1 END) AS closed_merged_count
        FROM pullrequestinfo
        WHERE repoid = ANY(@repos) AND createdat >= '{lastWeek:yyyy-MM-dd}' AND author = '{UserLogin}'";

        using (var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            using (var command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@repos", repos);

                using var reader = await command.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    open = reader.GetInt32(0);
                    closed = reader.GetInt32(1);
                    merged = reader.GetInt32(2);
                }
            }

            await connection.CloseAsync();
        }

        List<int> result = [open, closed, merged];

        return Ok(result);
    }

    [HttpGet("analytics/{owner}/{repoName}")]
    public async Task<ActionResult> GetPriorityDistribution(string owner, string repoName)
    {
        //last index highest priority
        //first index lowest priority
        List<int> result = [0, 0, 0, 0, 0];

        using (NpgsqlConnection conn = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await conn.OpenAsync();

            string selects = "priority, COUNT(*) as amount";
            string q = "SELECT " + selects + " FROM pullrequestinfo WHERE repoowner=@ownerLogin AND reponame=@repoName AND state='open' GROUP BY priority";
            using (NpgsqlCommand command = new NpgsqlCommand(q, conn))
            {
                command.Parameters.AddWithValue("@ownerLogin", owner);
                command.Parameters.AddWithValue("@repoName", repoName);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var pri = reader.GetInt32(0);
                        result[pri] = reader.GetInt32(1);
                    }
                }
            }

            await conn.CloseAsync();
        }

        return Ok(result);
    }

    [HttpGet("analytics/{owner}/{repoName}/all")]
    public async Task<ActionResult> GetPriorityDistributionAllTime(string owner, string repoName)
    {
        if (UserLogin == "HubReview-tester" && repoName == "hubreview")
        {
            List<int> res = [26, 58, 76, 26, 35];
            return Ok(res);
        }
        //last index highest priority
        //first index lowest priority
        List<int> result = [0, 0, 0, 0, 0];

        using (NpgsqlConnection conn = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await conn.OpenAsync();

            string selects = "priority, COUNT(*) as amount";
            string q = "SELECT " + selects + " FROM pullrequestinfo WHERE repoowner=@ownerLogin AND reponame=@repoName GROUP BY priority";
            using (NpgsqlCommand command = new NpgsqlCommand(q, conn))
            {
                command.Parameters.AddWithValue("@ownerLogin", owner);
                command.Parameters.AddWithValue("@repoName", repoName);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var pri = reader.GetInt32(0);
                        result[pri] = reader.GetInt32(1);
                    }
                }
            }

            await conn.CloseAsync();
        }

        return Ok(result);
    }

    [HttpGet("analytics/{owner}/{repoName}/avg_merged_time")]
    public async Task<ActionResult> GetAvgMergedTime(string owner, string repoName)
    {
        if (UserLogin == "HubReview-tester" && repoName == "hubreview")
        {
            List<object> array = [
                new
                {
                    MergedDate = "2024-04-29",
                    PrCount = 1,
                    AvgMergeTime = "0.01:56",
                },
                new
                {
                    MergedDate = "2024-04-30",
                    PrCount = 3,
                    AvgMergeTime = "0.01:32",
                },
                new
                {
                    MergedDate = "2024-05-01",
                    PrCount = 8,
                    AvgMergeTime = "0.01:58",
                },
                new
                {
                    MergedDate = "2024-05-02",
                    PrCount = 5,
                    AvgMergeTime = "0.02:02",
                },
                new
                {
                    MergedDate = "2024-05-03",
                    PrCount = 5,
                    AvgMergeTime = "0.01:04",
                },
                new
                {
                    MergedDate = "2024-05-04",
                    PrCount = 5,
                    AvgMergeTime = "0.00:55",
                }
            ];
            return Ok(array);
        }

        var states = new List<PullRequestState> { PullRequestState.Merged };

        var query = new Query()
            .Repository(Var("repoName"), Var("owner"))
            .PullRequests(last: 100, states: new Arg<IEnumerable<PullRequestState>>(states))
            .Nodes
            .Select(pr => new
            {
                CreatedDate = pr.CreatedAt,
                MergedDate = pr.MergedAt
            })
            .Compile();

        var mergedPrs = await GitHubUserGraphQLConnection.Run(query, new Dictionary<string, object>
        {
            { "owner", owner },
            { "repoName", repoName },
        });

        var lastWeek = DateTime.Today.AddDays(-7);

        var groupedByMergedDate = mergedPrs
            .Where(x => x.MergedDate <= DateTime.Today && x.MergedDate >= lastWeek)
            .GroupBy(pr => DateTimeOffset.Parse(pr.MergedDate.ToString()!).ToString("yyyy-MM-dd"))
            .Select(group => new
            {
                MergedDate = group.Key,
                PrCount = group.Count(),
                AvgMergeTime = group.Average(pr => (long?)(pr.MergedDate - pr.CreatedDate)?.TotalMinutes)
            })
            .ToList()
            .Select(group => new
            {
                group.MergedDate,
                group.PrCount,
                AvgMergeTime = group.AvgMergeTime.HasValue ? TimeSpan.FromMinutes(group.AvgMergeTime.Value).ToString(@"dd\.hh\:mm") : "00.00:00"
            })
            .ToList();

        return Ok(groupedByMergedDate);
    }

    /*[HttpGet("analytics/{owner}/{repoName}/waiting_review")]
    public async Task<ActionResult> GetWaitTimeForReview(string owner, string repoName)
    {


        return Ok();
    }*/

    [HttpGet("analytics/{owner}/{repoName}/review_statuses")]
    public async Task<ActionResult> GetReviewStatuses(string owner, string repoName)
    {
        /*var states = new List<PullRequestState> { PullRequestState.Open };

        var reviews = new List<Octokit.GraphQL.Model.PullRequestReviewState> {
            Octokit.GraphQL.Model.PullRequestReviewState.Commented,
            Octokit.GraphQL.Model.PullRequestReviewState.Pending,
            Octokit.GraphQL.Model.PullRequestReviewState.Approved,
            Octokit.GraphQL.Model.PullRequestReviewState.ChangesRequested
        };

        var query = new Query()
            .Repository(Var("repoName"), Var("owner"))
            .PullRequests(last: 100, states: new Arg<IEnumerable<PullRequestState>>(states))
            .Nodes
            .Select(pr => new
            {
                pr.Id,
                Reviews = pr.Reviews(null, null, null, null, null, new Arg<IEnumerable<Octokit.GraphQL.Model.PullRequestReviewState>>(reviews))
                .Nodes
                .Select( r => new {r.Id, r.State})
                .ToList()
            })
            .Compile();

        Console.WriteLine(query);

        var prs = await connection.Run(query, new Dictionary<string, object>
        {
            { "owner", owner },
            { "repoName", repoName },
        });*/

        if (UserLogin == "HubReview-tester" && repoName == "hubreview")
        {
            List<object> array = [
                new
                {
                    FirstDay = "2024-04-22",
                    LastDay = "2024-04-28",
                    ApprovedCount = 14,
                    CommentedCount = 19,
                    ChangesReqCount = 5,
                    PendingCount = 0
                },
                new
                {
                    FirstDay = "2024-04-29",
                    LastDay = "2024-05-05",
                    ApprovedCount = 15,
                    CommentedCount = 17,
                    ChangesReqCount = 3,
                    PendingCount = 1
                },
                new
                {
                    FirstDay = "2024-05-06",
                    LastDay = "2024-05-12",
                    ApprovedCount = 1,
                    CommentedCount = 2,
                    ChangesReqCount = 0,
                    PendingCount = 1
                }
            ];
            return Ok(array);
        }

        var result = new List<ReviewStats>();
        List<RevStatusObj> prReviewsCombined = [];
        int[][] prnumbers = new int[3][];

        var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);

        var weeks = new List<(DateTime start, DateTime end)>();
        DateTime today = DateTime.Today;

        // Calculate the start and end dates for the last 4 weeks
        for (int i = 0; i < 3; i++)
        {
            DateTime startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1 - (i * 7)); // Start from Monday
            DateTime endOfWeek = startOfWeek.AddDays(6); // End on Sunday
            weeks.Add((startOfWeek, endOfWeek));

            result.Add(new ReviewStats
            {
                FirstDay = startOfWeek.ToString("yyyy-MM-dd"),
                LastDay = endOfWeek.ToString("yyyy-MM-dd"),
                ApprovedCount = 0,
                CommentedCount = 0,
                ChangesReqCount = 0,
                PendingCount = 0
            });

            string query = $"SELECT pullnumber FROM pullrequestinfo WHERE reponame = '{repoName}' AND updatedat BETWEEN '{startOfWeek:yyyy-MM-dd}' AND '{endOfWeek:yyyy-MM-dd}'";
            connection.Open();
            using (var command = new NpgsqlCommand(query, connection))
            {
                var reader = await command.ExecuteReaderAsync();
                List<int> prNumbersList = new List<int>();
                while (await reader.ReadAsync())
                {
                    prNumbersList.Add(reader.GetFieldValue<int>(0));
                }
                prnumbers[i] = prNumbersList.ToArray();
            }
            connection.Close();
        }

        //var prs = await client.PullRequest.GetAllForRepository(owner, repoName);

        for (int i = 0; i < 3; i++)
        {
            foreach (var pr in prnumbers[i])
            {
                var reviews = GitHubUserClient.PullRequest.Review.GetAll(owner, repoName, pr)
                    .Result
                    .Select(r => new RevStatusObjHelper
                    {
                        reviewId = r.Id,
                        reviewState = r.State.StringValue,
                        submissionDate = r.SubmittedAt.DateTime
                    })
                    .ToArray();

                /*var reviewStateCounts = reviews
                    .GroupBy(r => r.reviewState)
                    .Select(group => new {
                        ReviewState = group.Key,
                        Count = group.Count()
                    })
                    .ToList();*/


                prReviewsCombined.Add(new RevStatusObj
                {
                    pr = pr,
                    reviews = reviews
                });
            }
        }

        foreach (RevStatusObj item in prReviewsCombined)
        {
            if (item.reviews == null || item.reviews.Length == 0)
            {
                continue;
            }

            foreach (var rev in item.reviews)
            {
                for (int i = 0; i < 3; i++)
                {
                    if (rev.submissionDate >= weeks[i].start && rev.submissionDate <= weeks[i].end)
                    {
                        switch (rev.reviewState)
                        {
                            case "APPROVED":
                                result[i].ApprovedCount++;
                                break;
                            case "COMMENTED":
                                result[i].CommentedCount++;
                                break;
                            case "CHANGES_REQUESTED":
                                result[i].ChangesReqCount++;
                                break;
                            default:
                                result[i].PendingCount++;
                                break;
                        }
                    }
                }
            }
        }

        return Ok(result);
    }

    [HttpGet("analytics/{owner}/{repoName}/label")]
    public async Task<Dictionary<string, int>> GetLabelUsage(string owner, string repoName)
    {
        var allPullRequests = await GitHubUserClient.PullRequest.GetAllForRepository(owner, repoName, new PullRequestRequest { State = ItemStateFilter.Open });

        var labelUsage = new ConcurrentDictionary<string, int>();

        Parallel.ForEach(allPullRequests, pullRequest =>
        {
            var labels = pullRequest.Labels.Select(label => label.Name);

            foreach (var label in labels)
            {
                if (!label.StartsWith("Priority:"))
                {
                    labelUsage.AddOrUpdate(label, 1, (_, count) => count + 1); // Thread-safe update of label count
                }
            }
        });

        return labelUsage.ToDictionary(kv => kv.Key, kv => kv.Value);
    }

    [HttpGet("analytics/{owner}/{repoName}/label/all")]
    public async Task<Dictionary<string, int>> GetLabelUsageAllTime(string owner, string repoName)
    {
        if (UserLogin == "HubReview-tester" && repoName == "hubreview")
        {
            Dictionary<string, int> dict = new Dictionary<string, int>
            {
                { "nitpick", 2 },
                { "refactoring", 18 },
                { "suggestion", 13 },
                { "bug", 24 },
                { "enhancement", 28 },
                { "documentation", 5 },
                { "question", 11 }
            };

            return dict;
        }

        var allPullRequests = await GitHubUserClient.PullRequest.GetAllForRepository(owner, repoName, new PullRequestRequest { State = ItemStateFilter.All });

        var labelUsage = new ConcurrentDictionary<string, int>();

        Parallel.ForEach(allPullRequests, pullRequest =>
        {
            var labels = pullRequest.Labels.Select(label => label.Name);

            foreach (var label in labels)
            {
                if (!label.StartsWith("Priority:"))
                {
                    labelUsage.AddOrUpdate(label, 1, (_, count) => count + 1); // Thread-safe update of label count
                }
            }
        });

        return labelUsage.ToDictionary(kv => kv.Key, kv => kv.Value);
    }

    [HttpGet("repository/{owner}/{repo}/{branch}/protection/{prnumber}")]
    public async Task<ActionResult> GetBranchProtection(string owner, string repo, string branch, long prnumber)
    {

        var pull = await GitHubUserClient.PullRequest.Get(owner, repo, (int)prnumber);

        var isConflict = pull.MergeableState == "dirty";

        var query = new Query()
            .RepositoryOwner(owner)
            .Repository(repo)
            .BranchProtectionRules(null, null, null, null)
            .AllPages()
            .Select(
                r => new
                {
                    // For this code, use the output of the loop above.
                    required_checks = r.RequiredStatusCheckContexts,
                    requiredApprovals = r.RequiredApprovingReviewCount,
                    requiredConversationResolution = r.RequiresConversationResolution,
                    pattern = r.Pattern
                })
            .Compile();

        var response = await GitHubUserGraphQLConnection.Run(query);

        var result = response.FirstOrDefault(r => r.pattern == branch);

        if (result != null)
        {
            return Ok(new { required_checks = result.required_checks, requiredApprovals = result.requiredApprovals, isConflict = isConflict, requiredConversationResolution = result.requiredConversationResolution });
        }

        return Ok(new { required_checks = new List<string>(), requiredApprovals = 0, isConflict = isConflict, requiredConversationResolution = false });
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/{state}")]
    public async Task<ActionResult> ClosePullRequest(string owner, string repoName, long prnumber, string state)
    {
        try
        {
            await GitHubUserClient.PullRequest.Update(owner, repoName, (int)prnumber, new PullRequestUpdate
            {
                State = state == "open" ? ItemState.Open : ItemState.Closed
            });

            using var connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString);
            connection.Open();

            string query = $"UPDATE pullrequestinfo SET updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE reponame = '{repoName}' AND pullnumber = {prnumber}";

            using (var command = new NpgsqlCommand(query, connection))
            {
                command.ExecuteNonQuery();
            }

            connection.Close();

            return Ok($"Pull request #{prnumber} in repository {repoName} is closed/opened.");
        }
        catch (NotFoundException)
        {
            return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
        }
    }

    // everyone can assign priority option olsun eğer seçiliyse repodaki herkes ekleyebilir, yoksa sadece aşağıdakiler
    // user type usersa direkt sahibi döndür.
    // userın type ı organizasyonsa, https://api.github.com/orgs/hubreviewapp/members?role=admin request.

    [HttpGet("{repoOwner}/{repoName}/repoadmins/{userLogin}")]
    public async Task<bool> GetRepoAdmins(string repoOwner, string userLogin)
    {
        List<string> result = new List<string>();

        var user = await GitHubUserClient.User.Get(repoOwner);

        if (user.Type.ToString() == "Organization")
        {
            var role = OrganizationMembersRole.Admin; // Set the role to Admin

            var members = await GitHubUserClient.Organization.Member.GetAll(repoOwner, role);

            result.AddRange(members.Select(member => member.Login));
        }
        else
        {
            result.Add(repoOwner);
        }

        return result.Contains(userLogin);
    }

    [HttpGet("{repoOwner}/{repoName}/repoprioritysetters/{userLogin}")]
    public async Task<ActionResult> GetRepoPrioritySetters(string repoOwner, string repoName, string userLogin)
    {
        List<string> result = new List<string>();

        var user = await GitHubUserClient.User.Get(repoOwner);

        var onlyAdmin = false;
        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string selects = "onlyAdmin";
            string query = "SELECT " + selects + " FROM repositoryinfo WHERE ownerLogin = @repoOwner AND name = @repoName ";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@repoOwner", repoOwner);
                command.Parameters.AddWithValue("@repoName", repoName);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        onlyAdmin = reader.GetBoolean(0);
                    }
                }
            }

            await connection.CloseAsync();
        }

        if (onlyAdmin)
        {
            if (user.Type.ToString() == "Organization")
            {

                var role = OrganizationMembersRole.Admin; // Set the role to Admin

                var members = await GitHubUserClient.Organization.Member.GetAll(repoOwner, role);

                result.AddRange(members.Select(member => member.Login));
            }
            else
            {
                result.Add(repoOwner);
            }
        }
        else
        {
            result = await GetRepoCollaborators(repoOwner, repoName);
        }

        return Ok(result.Contains(userLogin));
    }

    public async Task<List<string>> GetRepoCollaborators(string repoOwner, string repoName)
    {
        List<string> result = new List<string>();

        var collaborators = await GitHubUserClient.Repository.Collaborator.GetAll(repoOwner, repoName);
        result.AddRange(collaborators.Select(collaborator => collaborator.Login));

        return result;
    }

    [HttpGet("{repoOwner}/{repoName}/changeonlyadmin/{onlyAdmin}")]
    public async Task<ActionResult> SetRepoSetting(string repoOwner, string repoName, bool onlyAdmin)
    {
        List<string> result = new List<string>();

        var user = await GitHubUserClient.User.Get(repoOwner);

        using (NpgsqlConnection connection = new NpgsqlConnection(_coreConfiguration.DbConnectionString))
        {
            await connection.OpenAsync();

            string query = "UPDATE repositoryinfo SET onlyAdmin = @onlyAdmin WHERE ownerLogin = @repoOwner AND name = @repoName ";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@repoOwner", repoOwner);
                command.Parameters.AddWithValue("@repoName", repoName);
                command.Parameters.AddWithValue("@onlyAdmin", onlyAdmin);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        onlyAdmin = reader.GetBoolean(0);
                    }
                }
            }

            await connection.CloseAsync();
        }
        return Ok("Successfully updated");
    }
}

