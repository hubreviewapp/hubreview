using System.ComponentModel;
using System.Data;
using System.Text;
using System.Web;
using CS.Core.Configuration;
using CS.Core.Entities;
using CS.Web.Models.Api.Request;
using DotEnv.Core;
using GitHubJwt;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Npgsql;
using Octokit;
using Octokit.GraphQL;
using Octokit.GraphQL.Core;
using Octokit.GraphQL.Core.Builders;
using Octokit.GraphQL.Model;
using Swashbuckle.AspNetCore.SwaggerGen;
using static Octokit.GraphQL.Variable;



namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubController : ControllerBase
{

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEnvReader _reader;
    private GitHubClient _appClient;

    public object[]? Reviews { get; private set; }

    private static GitHubClient _getGitHubClient(string token)
    {
        return new GitHubClient(new Octokit.ProductHeaderValue("HubReviewApp"))
        {
            Credentials = new Credentials(token, AuthenticationType.Bearer)
        };
    }

    private GitHubJwtFactory _getGitHubJwtGenerator()
    {
        return new GitHubJwtFactory(
            new FilePrivateKeySource(_reader["PK_RELATIVE_PATH"]),
            new GitHubJwtFactoryOptions
            {
                AppIntegrationId = _reader.GetIntValue("APP_ID"), // The GitHub App Id
                ExpirationSeconds = _reader.GetIntValue("EXP_TIME") // 10 minutes is the maximum time allowed
            }
        );
    }

    private GitHubClient GetNewClient(string? token = null)
    {
        GitHubClient res;

        if (token == null)
        {
            GitHubJwtFactory generator = _getGitHubJwtGenerator();
            string jwtToken = generator.CreateEncodedJwtToken();
            res = _getGitHubClient(jwtToken);

        }
        else
        {
            res = _getGitHubClient(token);
        }
        return res;
    }

    private static string GenerateRandomColor()
    {
        var random = new Random();
        var color = String.Format("#{0:X6}", random.Next(0x1000000)); // Generates a random color code in hexadecimal format
        return color;
    }

    [ActivatorUtilitiesConstructor]
    public GitHubController(IHttpContextAccessor httpContextAccessor, IEnvReader reader)
    {
        _httpContextAccessor = httpContextAccessor;
        _reader = reader;
        _appClient = GetNewClient();
    }

    [HttpGet("acquireToken")]
    public async Task<ActionResult> acquireToken(string code)
    {
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);

        connection.Open();


        using (var httpClient = new HttpClient())
        {
            var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"client_id", _reader["CLIENT_ID"]},
                {"client_secret", _reader["CLIENT_SECRET"]},
                {"code", code},
                {"redirect_uri", _reader["ACQUIRE_TOKEN_REDIRECT_URI"]},
            });

            var tokenResponse = await httpClient.PostAsync("https://github.com/login/oauth/access_token", tokenRequest);
            var responseContent = await tokenResponse.Content.ReadAsStringAsync();

            // Parse the response to get the access token
            var parsedResponse = HttpUtility.ParseQueryString(responseContent);
            var access_token = parsedResponse["access_token"];

            GitHubClient userClient = GetNewClient(access_token);
            var user = await userClient.User.Current();

            string exists = "SELECT EXISTS (SELECT 1 FROM userinfo WHERE userid = @userid LIMIT 1)";
            bool doesExist = false;
            using (NpgsqlCommand command = new NpgsqlCommand(exists, connection))
            {
                command.Parameters.AddWithValue("@userid", user.Id);
                var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    doesExist = reader.GetBoolean(0);
                }

            }

            await connection.CloseAsync();
            var orgs = await userClient.Organization.GetAllForCurrent();
            var orgList = orgs.Select(o => o.Login).ToArray();


            if (!doesExist)
            {
                string parameters = "(userid, login, fullname, email, avatarurl, profileurl, organizations, workload, token)";
                string at_parameters = "(@userid, @login, @fullname, @email, @avatarurl, @profileurl, @organizations, @workload, @token)";
                string query = "INSERT INTO userinfo " + parameters + " VALUES " + at_parameters;

                connection.Open();

                using (NpgsqlCommand command2 = new NpgsqlCommand(query, connection))
                {
                    command2.Parameters.AddWithValue("@userid", user.Id);
                    command2.Parameters.AddWithValue("@login", user.Login);
                    command2.Parameters.AddWithValue("@fullname", user.Name);
                    if (user.Email != null)
                    {
                        command2.Parameters.AddWithValue("@email", user.Email);
                    }
                    else
                    {
                        command2.Parameters.AddWithValue("@email", DBNull.Value);
                    }
                    command2.Parameters.AddWithValue("@avatarurl", user.AvatarUrl);
                    command2.Parameters.AddWithValue("@profileurl", user.Url);
                    command2.Parameters.AddWithValue("@organizations", orgList);
                    command2.Parameters.AddWithValue("@workload", 0);
                    if (access_token != null)
                    {
                        command2.Parameters.AddWithValue("@token", access_token);
                    }
                    else
                    {
                        command2.Parameters.AddWithValue("@token", DBNull.Value);
                    }


                    command2.ExecuteNonQuery();
                }

                await connection.CloseAsync();
            }
            else
            {
                string query = @"
                    UPDATE userinfo
                    SET email = @email,
                        login = @login,
                        fullname = @fullname,
                        profileurl = @profileurl,
                        organizations = @organizations,
                        token = @token
                    WHERE userid = @userid";

                connection.Open();

                using (NpgsqlCommand command2 = new NpgsqlCommand(query, connection))
                {
                    command2.Parameters.AddWithValue("@userid", user.Id);
                    command2.Parameters.AddWithValue("@login", user.Login);
                    command2.Parameters.AddWithValue("@fullname", user.Name);
                    if (user.Email != null)
                    {
                        command2.Parameters.AddWithValue("@email", user.Email);
                    }
                    else
                    {
                        command2.Parameters.AddWithValue("@email", DBNull.Value);
                    }
                    command2.Parameters.AddWithValue("@profileurl", user.Url);
                    command2.Parameters.AddWithValue("@organizations", orgList);
                    command2.Parameters.AddWithValue("@token", access_token);

                    command2.ExecuteNonQuery();
                }
                await connection.CloseAsync();
            }

            _httpContextAccessor?.HttpContext?.Session.SetString("UserLogin", user.Login);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserAvatarURL", user.AvatarUrl);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserName", user.Name);
            _httpContextAccessor?.HttpContext?.Session.SetString("AccessToken", access_token);

            return Redirect($"http://localhost:5173");
        }
    }

    [HttpGet("getUserInfo")]
    public ActionResult getUserInfo()
    {

        var userInfo = new
        {
            UserName = _httpContextAccessor?.HttpContext?.Session.GetString("UserName"),
            UserLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"),
            UserAvatarUrl = _httpContextAccessor?.HttpContext?.Session.GetString("UserAvatarURL")
        };

        return Ok(userInfo);
    }

    [HttpGet("logoutUser")]
    public ActionResult logoutUser()
    {
        _httpContextAccessor?.HttpContext?.Session.Clear();
        return Ok();

    }

    [HttpGet("getRepository")]
    public async Task<ActionResult> getRepository()
    {
        /*
        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        string? userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var userClient = GetNewClient(access_token);

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        // Store all repositories
        var allRepos = new List<RepoInfo>();

        var installations = await _appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await _appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);
                var repos = await installationClient.GitHubApps.Installation.GetAllRepositoriesForCurrent();

                // Add repositories to the list
                allRepos.AddRange(repos.Repositories.Select(rep => new RepoInfo
                {
                    Id = rep.Id,
                    Name = rep.Name,
                    OwnerLogin = rep.Owner.Login,
                    CreatedAt = rep.CreatedAt.Date.ToString("dd/MM/yyyy")
                }));
            }
        }

        if (allRepos.Any())
        {
            var sortedRepos = allRepos.OrderBy(repo => repo.Name).ToArray();
            return Ok(new { RepoNames = sortedRepos });
        }

        return NotFound("There exists no user in session.");
        */

        // Get repositories from the database
        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        string? userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var userClient = GetNewClient(access_token);

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        List<RepoInfo> allRepos = new List<RepoInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string query = "SELECT id, name, ownerLogin, created_at FROM repositoryinfo WHERE ownerLogin = @ownerLogin OR ownerLogin = ANY(@organizationLogins) ORDER BY name ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        RepoInfo repo = new RepoInfo
                        {
                            Id = reader.GetInt64(0),
                            Name = reader.GetString(1),
                            OwnerLogin = reader.GetString(2),
                            CreatedAt = reader.GetFieldValue<DateOnly>(3)
                        };
                        allRepos.Add(repo);
                    }
                }
            }

            await connection.CloseAsync();
        }

        if (allRepos.Any())
        {
            return Ok(new { RepoNames = allRepos });
        }

        return NotFound("There are no repositories in the database.");

    }

    [HttpGet("getRepository/{id}")] // Update the route to include repository ID
    public async Task<Octokit.Repository?> GetRepositoryById(int id) // Change the method signature to accept ID
    {
        var appClient = GetNewClient();

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin)
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);


                // Get the repository by ID
                var repository = await installationClient.Repository.Get(id);

                // Now you have the repository object, you can use it or return it as needed
                Console.WriteLine($"Repository: {repository.FullName}");
                Console.WriteLine($"Repository URL: {repository.HtmlUrl}");
                Console.WriteLine($"Repository Description: {repository.Description}");

                return repository;
            }
        }
        return null;
    }

    [HttpGet("prs")]
    public async Task<ActionResult> getAllPRs()
    {
        /*
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var client = _getGitHubClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        // Get organizations for the current user
        var organizations = await client.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        var pullRequests = new List<PRInfo>([]); // Change list type to "PullRequest" to examine the PR data

        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);
                var repos = await installationClient.GitHubApps.Installation.GetAllRepositoriesForCurrent();

                foreach (var repository in repos.Repositories)
                {

                    var repoPulls = await installationClient.PullRequest.GetAllForRepository(repository.Id);


                    //foreach( var repoPull in repoPulls ){
                    //    var pull = await installationClient.PullRequest.Get(repository.Id, repoPull.Number);
                    //    pullRequests.Add(pull);
                    //}


                    foreach (var repoPull in repoPulls)
                    {
                        var pull = await installationClient.PullRequest.Get(repository.Id, repoPull.Number);
                        var repoPullsInfos = new PRInfo
                        {
                            Id = pull.Id,
                            Title = pull.Title,
                            PRNumber = pull.Number,
                            Author = pull.User.Login,
                            AuthorAvatarURL = pull.User.AvatarUrl,
                            CreatedAt = pull.CreatedAt.Date.ToString("dd/MM/yyyy"),
                            UpdatedAt = pull.UpdatedAt.Date.ToString("dd/MM/yyyy"),
                            RepoName = pull.Base.Repository.Name,
                            Additions = pull.Additions,
                            Deletions = pull.Deletions,
                            Files = pull.ChangedFiles,
                            Comments = pull.Comments,
                            Labels = pull.Labels.ToArray(),
                            RepoOwner = pull.Base.Repository.Owner.Login
                        };

                        pullRequests.Add(repoPullsInfos);
                    }

                }
            }
        }


        return Ok(pullRequests);*/

        // Get repositories from the database
        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        string? userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var userClient = GetNewClient(access_token);

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins)";// ORDER BY name ASC";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            RepoOwner = reader.GetString(13)
                        };
                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}")]
    public async Task<ActionResult> getPRById(string owner, string repoName, long prnumber)
    {
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin)
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);

                try
                {
                    var pull = await installationClient.PullRequest.Get(owner, repoName, (int)prnumber);
                    return Ok(pull);
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addLabel")]
    public async Task<ActionResult> addLabelToPR(string owner, string repoName, long prnumber, [FromBody] List<string> labelNames)
    {
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var client = _getGitHubClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        // Get organizations for the current user
        var organizations = await client.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);

                try
                {
                    // Get the existing labels of the repository
                    var labels = await installationClient.Issue.Labels.GetAllForRepository(owner, repoName);

                    foreach (var labelName in labelNames)
                    {
                        // Find the label by name
                        var label = labels.FirstOrDefault(l => l.Name.Equals(labelName, StringComparison.OrdinalIgnoreCase));
                        if (label == null)
                        {
                            // If the label does not exist, create it
                            var randomColor = GenerateRandomColor();
                            label = await client.Issue.Labels.Create(owner, repoName, new NewLabel(labelName, "ffffff"));
                        }

                        // Add the label to the pull request
                        await client.Issue.Labels.AddToIssue(owner, repoName, (int)prnumber, new[] { label.Name });
                    }

                    return Ok($"Labels '{string.Join(",", labelNames)}' added to pull request #{prnumber} in repository {repoName}.");
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/{labelName}")]
    public async Task<ActionResult> RemoveLabelFromPR(string owner, string repoName, long prnumber, string labelName)
    {
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var client = _getGitHubClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        // Get organizations for the current user
        var organizations = await client.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);

                try
                {
                    // Get the existing labels of the repository
                    var labels = await installationClient.Issue.Labels.GetAllForRepository(owner, repoName);

                    // Find the label by name
                    var label = labels.FirstOrDefault(l => l.Name.Equals(labelName, StringComparison.OrdinalIgnoreCase));
                    if (label == null)
                    {
                        return NotFound($"Label '{labelName}' not found in repository {repoName}.");
                    }

                    // Remove the label from the pull request
                    await client.Issue.Labels.RemoveFromIssue(owner, repoName, (int)prnumber, labelName);
                    return Ok($"Label '{labelName}' removed from pull request #{prnumber} in repository {repoName}.");
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} in repository {repoName} does not have a label named {labelName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/request_review")]
    public async Task<ActionResult> requestReview(string owner, string repoName, long prnumber, [FromBody] string[] reviewers)
    {

        var appClient = GetNewClient();
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        // Get organizations for the current user
        var organizations = await client.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    var reviewRequest = new PullRequestReviewRequest(reviewers, null);
                    var pull = await client.PullRequest.ReviewRequest.Create(owner, repoName, (int)prnumber, reviewRequest);
                    return Ok($"{string.Join(",", reviewers)} is assigned to PR #{prnumber}.");
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");

    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{prnumber}/remove_reviewer/{reviewer}")]
    public async Task<ActionResult> removeReviewer(string owner, string repoName, long prnumber, string reviewer)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    string[] arr = [reviewer];
                    var reviewRequest = new PullRequestReviewRequest(arr, null);
                    await client.PullRequest.ReviewRequest.Delete(owner, repoName, (int)prnumber, reviewRequest);
                    return Ok($"{reviewer} is removed from PR #{prnumber}.");
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/addComment")]
    public async Task<ActionResult> AddCommentToPR(string owner, string repoName, int prnumber, [FromBody] string commentBody)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        string decorated_body = $"<!--Using HubReview-->**ACTIVE**: {commentBody}";
        var comment = await client.Issue.Comment.Create(owner, repoName, prnumber, decorated_body);

        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string query = $"INSERT INTO comments VALUES ({comment.Id}, '{repoName}', {prnumber}, {false}, '', '', 'ACTIVE')";
        using (var command = new NpgsqlCommand(query, connection))
        {
            command.ExecuteNonQuery();
        }
        connection.Close();

        return Ok($"Comment added to pull request #{prnumber} in repository {repoName}.");
    }

    [HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateCommentStatus")]
    public async Task<ActionResult> UpdateStatus(string owner, string repoName, int comment_id, [FromBody] string status)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        bool is_review = false;
        Octokit.PullRequestReviewComment? res1 = null;
        Octokit.IssueComment? res2 = null;


        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string select = $"SELECT is_review FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
        }

        reader.Close();
        connection.Close();

        if (is_review)
        {
            var comment = await client.PullRequest.ReviewComment.GetComment(owner, repoName, comment_id);
            string new_body = $"<!--Using HubReview-->**{status}** {comment.Body[comment.Body.IndexOf('\n')..]}";
            res1 = await client.PullRequest.ReviewComment.Edit(owner, repoName, comment_id, new PullRequestReviewCommentEdit(new_body));
        }
        else
        {
            var comment = await client.Issue.Comment.Get(owner, repoName, comment_id);
            string new_body = $"<!--Using HubReview-->**{status}**: {comment.Body[(comment.Body.IndexOf(':') + 2)..]}";
            res2 = await client.Issue.Comment.Update(owner, repoName, comment_id, new_body);
        }

        connection.Open();

        string query = $"UPDATE comments SET status = '{status}' where commentid = {comment_id}";
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }
        connection.Close();

        return (res1 == null) ? Ok(res2) : Ok(res1);
    }

    [HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateComment")]
    public async Task<ActionResult> UpdateComment(string owner, string repoName, int comment_id, [FromBody] string body)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        bool is_review = false;
        Octokit.PullRequestReviewComment? res1 = null;
        Octokit.IssueComment? res2 = null;


        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string select = $"SELECT is_review FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
        }

        reader.Close();
        connection.Close();

        if (is_review)
        {
            var comment = await client.PullRequest.ReviewComment.GetComment(owner, repoName, comment_id);
            var before_colon = comment.Body[..(comment.Body.IndexOf(':') + 2)];
            string new_body = before_colon + body;
            res1 = await client.PullRequest.ReviewComment.Edit(owner, repoName, comment_id, new PullRequestReviewCommentEdit(body = new_body));
        }
        else
        {
            var comment = await client.Issue.Comment.Get(owner, repoName, comment_id);
            var before_colon = comment.Body[..(comment.Body.IndexOf(':') + 2)];
            string new_body = before_colon + body;
            res2 = await client.Issue.Comment.Update(owner, repoName, comment_id, new_body);
        }

        return (res1 == null) ? Ok(res2) : Ok(res1);
    }

    [HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
    public async Task<ActionResult> DeleteComment(string owner, string repoName, int comment_id)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        bool is_review = false;

        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string select = $"SELECT is_review FROM comments WHERE commentid = {comment_id}";

        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            is_review = reader.GetBoolean(0);
        }

        reader.Close();
        connection.Close();

        if (is_review)
        {
            await client.PullRequest.ReviewComment.Delete(owner, repoName, comment_id);
        }
        else
        {
            await client.Issue.Comment.Delete(owner, repoName, comment_id);
        }

        connection.Open();

        string query = $"DELETE FROM comments WHERE commentid = {comment_id}";
        using (var command2 = new NpgsqlCommand(query, connection))
        {
            command2.ExecuteNonQuery();
        }
        connection.Close();

        return Ok($"Comment deleted.");
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_comments")]
    public async Task<ActionResult> getCommentsOnPR(string owner, string repoName, int prnumber)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<IssueCommentInfo>([]);
        var processedCommentIds = new HashSet<long>();

        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                var comments = await installationClient.Issue.Comment.GetAllForIssue(owner, repoName, prnumber);

                foreach (var comm in comments)
                {
                    // Check if the comment ID has already been processed
                    if (!processedCommentIds.Contains(comm.Id))
                    {

                        if (!comm.Body.Contains("<!--Using HubReview-->"))
                        {
                            var commentObj = new IssueCommentInfo
                            {
                                id = comm.Id,
                                author = comm.User.Login,
                                body = comm.Body,
                                label = null,
                                decoration = null,
                                status = null,
                                createdAt = comm.CreatedAt,
                                updatedAt = comm.UpdatedAt,
                                association = comm.AuthorAssociation.StringValue
                            };

                            result.Add(commentObj);
                        }
                        else
                        {
                            int index = comm.Body.IndexOf(':');
                            string parsed_message = comm.Body[(index + 2)..];

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
                                    body = parsed_message,
                                    label = reader.GetString(0),
                                    decoration = reader.GetString(1),
                                    status = reader.GetString(2),
                                    createdAt = comm.CreatedAt,
                                    updatedAt = comm.UpdatedAt,
                                    association = comm.AuthorAssociation.StringValue
                                };

                                result.Add(commentObj);
                            }

                            await connection.CloseAsync();
                        }

                        // Add the comment ID to the set of processed IDs
                        processedCommentIds.Add(comm.Id);
                    }

                }

            }
        }

        return Ok(result);
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_review_comments")]
    public async Task<ActionResult> getRevCommentsOnPR(string owner, string repoName, int prnumber)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<IssueCommentInfo>([]);
        var processedCommentIds = new HashSet<long>();

        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                var reviews = await installationClient.PullRequest.ReviewComment.GetAll(owner, repoName, prnumber);

                foreach (var rev in reviews)
                {
                    // Check if the comment ID has already been processed
                    if (!processedCommentIds.Contains(rev.Id))
                    {

                        if (!rev.Body.Contains("<!--Using HubReview-->"))
                        {
                            var commentObj = new IssueCommentInfo
                            {
                                id = rev.Id,
                                author = rev.User.Login,
                                body = rev.Body,
                                label = null,
                                decoration = null,
                                status = null,
                                createdAt = rev.CreatedAt,
                                updatedAt = rev.UpdatedAt,
                                association = rev.AuthorAssociation.StringValue
                            };

                            result.Add(commentObj);
                        }
                        else
                        {
                            int index = rev.Body.IndexOf(':');
                            string parsed_message = rev.Body[(index + 2)..];

                            await connection.OpenAsync();
                            string query = $"SELECT label, decoration, status FROM comments WHERE commentid = {rev.Id}";
                            var command = new NpgsqlCommand(query, connection);
                            NpgsqlDataReader reader = await command.ExecuteReaderAsync();
                            while (await reader.ReadAsync())
                            {
                                var commentObj = new IssueCommentInfo
                                {
                                    id = rev.Id,
                                    author = rev.User.Login,
                                    body = parsed_message,
                                    label = reader.GetString(0),
                                    decoration = reader.GetString(1),
                                    status = reader.GetString(2),
                                    createdAt = rev.CreatedAt,
                                    updatedAt = rev.UpdatedAt,
                                    association = rev.AuthorAssociation.StringValue
                                };

                                result.Add(commentObj);
                            }

                            await connection.CloseAsync();
                        }



                        // Add the comment ID to the set of processed IDs
                        processedCommentIds.Add(rev.Id);

                    }

                }
            }
        }

        return Ok(result);
    }

    /*[HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_reviews")]
    public async Task<ActionResult> getReviewsOnPR(string owner, string repoName, int prnumber)
    {
        
        List<long> id_list = [];
        
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string select = $"SELECT review_id FROM reviewhead WHERE reponame = '{repoName}' AND prnumber = {prnumber}";
        
        using var command = new NpgsqlCommand(select, connection);
        NpgsqlDataReader reader = await command.ExecuteReaderAsync();
        while ( await reader.ReadAsync() )
        {
            id_list.Add(reader.GetInt64(0));
        }
        
        reader.Close();
        connection.Close();

        string select2 = $"SELECT (body, verdict, comments) FROM reviewhead WHERE review"

        return Ok(id_list);
    }*/

    [HttpPost("pullrequest/{owner}/{repoName}/{prnumber}/{sha}/addRevComment")]
    public async Task<ActionResult> AddRevCommentToPR(string owner, string repoName, int prnumber, string sha, [FromBody] CreateReviewRequestModel req)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        var rev = new PullRequestReviewCreate()
        {
            CommitId = sha,
            Body = req.body,
            Event = (req.verdict != "APPROVE") ? ((req.verdict != "REQUEST CHANGES") ? Octokit.PullRequestReviewEvent.Comment : Octokit.PullRequestReviewEvent.RequestChanges) : Octokit.PullRequestReviewEvent.Approve,
            Comments = []
        };

        if (req.comments.Length != 0)
        {
            foreach (var comment in req.comments)
            {
                var decorated_body = $"<!--Using HubReview-->\nACTIVE {comment.label} ({comment.decoration}): {comment.message}";
                var draft = new Octokit.DraftPullRequestReviewComment(decorated_body, comment.filename, comment.position);
                rev.Comments.Add(draft);
            }
        }

        var review = await client.PullRequest.Review.Create(owner, repoName, prnumber, rev);

        if (review == null)
        {
            return NotFound("Review can not be created.");
        }

        var published_comments = await client.PullRequest.Review.GetAllComments(owner, repoName, prnumber, review.Id);
        var comment_id_list = string.Join(",", published_comments.Select(c => c.Id));

        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();

        string query1 = $"INSERT INTO reviewhead (review_id, reponame, prnumber, body, verdict, comments) VALUES ({review.Id}, '{repoName}', {prnumber}, '{req.body}', '{req.verdict}', ARRAY[{comment_id_list}])";

        using (var command = new NpgsqlCommand(query1, connection))
        {
            command.ExecuteNonQuery();
        }

        string query2 = "INSERT INTO comments (commentid, reponame, prnumber, is_review, label, decoration, status) VALUES ";

        for (int i = 0; i < published_comments.Count; i++)
        {
            query2 += $"({published_comments[i].Id}, '{repoName}', {prnumber}, {true}, '{req.comments[i].label}', '{req.comments[i].decoration}', 'ACTIVE'), ";
        }

        query2 = query2[..^2];

        using (var command = new NpgsqlCommand(query2, connection))
        {
            command.ExecuteNonQuery();
        }

        connection.Close();


        return Ok($"Review added to pull request #{prnumber} in repository {repoName}.");
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_commits")]
    public async Task<ActionResult> getCommits(string owner, string repoName, int prnumber)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");
        var processedCommitIds = new HashSet<string>();
        var result = new List<CommitsList>([]);
        string link = "https://github.com/" + owner + "/" + repoName + "/pull/" + prnumber + "/commits/";

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);
                var commits = await installationClient.PullRequest.Commits(owner, repoName, prnumber);

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
                            githubLink = link + commit.Sha,
                            sha = commit.Sha
                        };
                    }

                    result[indexOfDate].commits?.Add(obj);

                    processedCommitIds.Add(commit.NodeId);

                }
            }

        }

        return Ok(result);
    }

    [HttpGet("commit/{owner}/{repoName}/{prnumber}/{sha}/get_patches")]
    public async Task<ActionResult> getDiffs(string owner, string repoName, int prnumber, string sha)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");
        var result = new List<object>([]);

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var commit = await userClient.Repository.Commit.Get(owner, repoName, sha);
                foreach (var file in commit.Files)
                {
                    var fileContent = await userClient.Repository.Content.GetAllContentsByRef(owner, repoName, file.Filename, sha);
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
        }
        return NotFound("not found");
    }

    [HttpGet("commit/{owner}/{repoName}/{prnumber}/get_all_patches")]
    public async Task<ActionResult> getAllPatches(string owner, string repoName, int prnumber)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");
        var result = new List<object>([]);

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var files = await userClient.PullRequest.Files(owner, repoName, prnumber);
                result.AddRange(files.Select(file => new
                {
                    name = file.FileName,
                    status = file.Status,
                    sha = file.Sha,
                    adds = file.Additions,
                    dels = file.Deletions,
                    changes = file.Changes,
                    content = file.Patch
                }));

                return Ok(result);
            }
        }
        return NotFound("not found");
    }

    [HttpGet("getPRReviewerSuggestion/{owner}/{repoName}/{prOwner}")]
    public async Task<ActionResult> getPRReviewerSuggestion(string owner, string repoName, string prOwner)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<CollaboratorInfo>();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == owner)
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    var collaborators = await installationClient.Repository.Collaborator.GetAll(owner, repoName);

                    foreach (var collaborator in collaborators)
                    {
                        if (collaborator.Login == prOwner)
                            continue; // Skip the pr owner

                        result.Add(new CollaboratorInfo
                        {
                            Id = collaborator.Id,
                            Login = collaborator.Login,
                            AvatarUrl = collaborator.AvatarUrl
                        });
                    }

                    return Ok(result);
                }
                catch (NotFoundException)
                {
                    return NotFound($"Repository {repoName} not found under owner {owner}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpGet("getRepoLabels/{owner}/{repoName}")]
    public async Task<ActionResult> GetRepoLabels(string owner, string repoName)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<LabelInfo>();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    var labels = await installationClient.Issue.Labels.GetAllForRepository(owner, repoName);

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
        }
        return NotFound("There exists no user in session.");
    }

    [HttpGet("getRepoAssignees/{owner}/{repoName}")]
    public async Task<ActionResult> GetRepoAssignees(string owner, string repoName)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<AssigneeInfo>();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    var assignees = await installationClient.Issue.Assignee.GetAllForRepository(owner, repoName);

                    foreach (var assignee in assignees)
                    {
                        result.Add(new AssigneeInfo
                        {
                            id = assignee.Id,
                            login = assignee.Login,
                            avatar_url = assignee.AvatarUrl,
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
        }
        return NotFound("There exists no user in session.");
    }

    [HttpGet("GetReviewerSuggestions/{owner}/{repoName}/{prNumber}")]
    public async Task<ActionResult> GetReviewerSuggestions(string owner, string repoName, int prNumber)
    {
        var productInformation = new Octokit.GraphQL.ProductHeaderValue("hubreviewapp", "1.0.0");
        var connection = new Octokit.GraphQL.Connection(productInformation, _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken").ToString());

        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        List<string> suggestedReviewersList = new List<string>();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin)
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

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

                var result = await connection.Run(query, vars);



                foreach (var suggestedReviewer in result.SuggestedReviewers)
                {
                    suggestedReviewersList.Add(suggestedReviewer.Login);
                }
                return Ok(result.SuggestedReviewers);
            }
        }

        return Ok(suggestedReviewersList);
    }

    [HttpGet("prs/needsreview")]
    public async Task<ActionResult> GetNeedsYourReview()
    {

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND @ownerLogin = ANY(reviewers)";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/userprs")]
    public async Task<ActionResult> GetUserPRs()
    {

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;
        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND author = @ownerLogin";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/waitingauthor")]
    public async Task<ActionResult> GetWaitingAuthors()
    {

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE ( @ownerLogin != ANY(reviewers) AND EXISTS ( SELECT 1 FROM json_array_elements(reviews) AS review WHERE review->>'login' = @ownerLogin) ) AND state='open' AND @ownerLogin != author AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/open")]
    public async Task<ActionResult> GetOpenPRs()
    {
        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/merged")]
    public async Task<ActionResult> GetMergedPRs()
    {

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE merged = true AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/closed")]
    public async Task<ActionResult> GetClosedPRs()
    {

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'closed' AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);

                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/needsreview/filter")]
    public async Task<ActionResult> FilterNeedsYourReviewPRs([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND @ownerLogin = ANY(reviewers)";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/userprs/filter")]
    public async Task<ActionResult> FilterUserPRs([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND author = @ownerLogin";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/waitingauthor/filter")]
    public async Task<ActionResult> FilterWaitingAuthors([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE ( @ownerLogin != ANY(reviewers) AND EXISTS ( SELECT 1 FROM json_array_elements(reviews) AS review WHERE review->>'login' = @ownerLogin) ) AND state='open' AND @ownerLogin != author AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }
    [HttpGet("prs/open/filter")]
    public async Task<ActionResult> FilterOpenPRs([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'open' AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/merged/filter")]
    public async Task<ActionResult> FilterMergedPRs([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE merged = true AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("prs/closed/filter")]
    public async Task<ActionResult> FilterClosedPRs([FromQuery] PRFilter filter)

    {
        /*
        filter.Assignee string
        filter.Author string
        filter.repositories string[]
        filter.FromDate string
        string priority 4--> Critical , 3 --> High, ... 1-> Low, 0-> Default

        */
        filter.Repositories = ["hubreviewapp.github.io"];
        filter.Author = "Ece-Kahraman";
        filter.FromDate = "thisyear";
        filter.Priority = "3";

        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        var userClient = GetNewClient(access_token);

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();


        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullid, title, pullnumber, author, authoravatarurl, createdat, updatedat, reponame, additions, deletions, changedfiles, comments, labels, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, reviewers";

            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE state = 'closed' AND ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) )";
            if (!string.IsNullOrEmpty(filter.Author))
            {
                query += " AND author = @author";
            }
            if (!string.IsNullOrEmpty(filter.Assignee))
            {
                query += " AND @assignee = ANY(assignees)";
            }
            query += " AND reponame = ANY(@repositories)";
            if (!string.IsNullOrEmpty(filter.Priority))
            {
                query += " AND priority = " + filter.Priority;
            }

            // Add date filter condition based on the selected value
            if (!string.IsNullOrEmpty(filter.FromDate))
            {
                switch (filter.FromDate.ToLower())
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
                        break;
                }
            }

            if (!string.IsNullOrEmpty(filter.OrderBy))
            {
                switch (filter.OrderBy.ToLower())
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
            /*
            if (filter.Labels != null && filter.Labels.Length > 0)
            {
                query += " AND labels @> @labels";
            }            
             */


            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
                if (!string.IsNullOrEmpty(filter.Author))
                {
                    command.Parameters.AddWithValue("@author", filter.Author);
                }
                if (!string.IsNullOrEmpty(filter.Assignee))
                {
                    command.Parameters.AddWithValue("@assignee", filter.Assignee);
                }
                command.Parameters.AddWithValue("@repositories", filter.Repositories);
                /*
                if (filter.Labels != null && filter.Labels.Length > 0)
                {
                    command.Parameters.AddWithValue("@labels", JsonConvert.SerializeObject(filter.Labels));
                } 
                */
                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        PRInfo pr = new PRInfo
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
                            Reviews = JsonConvert.DeserializeObject<object[]>(reader.GetString(20)),
                            Reviewers = reader.IsDBNull(21) ? new string[] { } : ((object[])reader.GetValue(21)).Select(obj => obj.ToString()).ToArray()

                        };

                        allPRs.Add(pr);
                    }
                }
            }

            await connection.CloseAsync();
        }

        return allPRs.Count != 0 ? Ok(allPRs) : NotFound("There are no pull requests visible to this user in the database.");
    }

    [HttpGet("user/weeklysummary")]
    public async Task<ActionResult> GetReviewsForUserInLastWeek()
    {
        var github = _getGitHubClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await github.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var lastWeek = DateTime.Today.AddDays(-7);

        using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
        {
            await connection.OpenAsync();

            string selects = "pullnumber, reponame, repoowner";
            string query = "SELECT " + selects + " FROM pullrequestinfo WHERE ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) ) AND updatedat >= @lastWeek AND EXISTS (SELECT 1 FROM json_array_elements(reviews) AS elem WHERE elem->>'login' = @ownerLogin)";
            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
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

        foreach (var pull in allPRs)
        {
            bool isReviewed = false;
            var reviews = await github.PullRequest.Review.GetAll(pull.RepoOwner, pull.RepoName, (int)pull.PRNumber);

            foreach (var review in reviews)
            {
                if (review.User.Login == userLogin && review.SubmittedAt >= lastWeek)
                {
                    reviewsLastWeek.Add(review);
                    submitted++;
                    isReviewed = true;
                    break;
                }
            }
        }



        var requestedReviewsCount = await GetRequestedPRs(github);

        var waitingReviewsCount = await GetWaitingReviews();

        // waiting --> o hafta yaratılmış ama henüz review edilmemiş olanlar (requested - submitted gibi)
        List<int> result = [submitted, requestedReviewsCount, waitingReviewsCount];

        return Ok(result);
    }

    public async Task<int> GetRequestedPRs(GitHubClient github)
    {
        var productInformation = new Octokit.GraphQL.ProductHeaderValue("hubreviewapp", "1.0.0");
        var connection = new Octokit.GraphQL.Connection(productInformation, _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken").ToString());

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");


        List<PRInfo> allPRs = new List<PRInfo>();
        var config = new CoreConfiguration();
        string connectionString = config.DbConnectionString;

        // Get organizations for the current user
        var organizations = await github.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var lastWeek = DateTime.Today.AddDays(-7);

        using (NpgsqlConnection conn = new NpgsqlConnection(connectionString))
        {
            await conn.OpenAsync();

            string selects = "pullnumber, reponame, repoowner";
            string q = "SELECT " + selects + " FROM pullrequestinfo WHERE ( repoowner = @ownerLogin OR repoowner = ANY(@organizationLogins) ) AND updatedat >= @lastWeek";
            using (NpgsqlCommand command = new NpgsqlCommand(q, conn))
            {
                command.Parameters.AddWithValue("@ownerLogin", _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"));
                command.Parameters.AddWithValue("@organizationLogins", organizationLogins);
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

        foreach (var pr in allPRs)
        {
            var query = new Query()
            .Repository(Var("name"), Var("owner"))
            .PullRequest(Var("prnumber"))
            .TimelineItems(40, null, null, null, null, null, null)
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

            var result = await connection.Run(query, vars);



            foreach (var node in result)
            {
                var reviewRequestedEvent = node as dynamic;
                var requestedReviewer = reviewRequestedEvent?.RequestedReviewer;
                var user = requestedReviewer?.User?.Login;
                var created = reviewRequestedEvent?.CreatedAt;

                if (user == userLogin && created >= lastWeek)
                {
                    requestedPRCount++;
                }
            }
        }

        return requestedPRCount;
    }

    public async Task<int> GetWaitingReviews()
    {

        try
        {
            var config = new CoreConfiguration();
            string connectionString = config.DbConnectionString;

            using (NpgsqlConnection connection = new NpgsqlConnection(connectionString))
            {
                await connection.OpenAsync();

                string query = "SELECT COUNT(*) FROM pullrequestinfo WHERE state = 'open' AND @ownerLogin = ANY(reviewers)";

                using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                {
                    // Assuming _httpContextAccessor.HttpContext.Session.GetString("UserLogin") returns the login string
                    string userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin") ?? "";
                    command.Parameters.AddWithValue("@ownerLogin", userLogin);

                    long waitingReviewsCount = (long)await command.ExecuteScalarAsync();
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
}
