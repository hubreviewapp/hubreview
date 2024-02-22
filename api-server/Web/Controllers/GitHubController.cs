using System.Web;
using DotEnv.Core;
using GitHubJwt;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Octokit;
using CS.Core.Entities;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubController : ControllerBase
{

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEnvReader _reader;
    private GitHubClient _appClient;

    private static GitHubClient _getGitHubClient(string token)
    {
        return new GitHubClient(new ProductHeaderValue("HubReviewApp"))
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

    private string GenerateRandomColor()
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

            _httpContextAccessor?.HttpContext?.Session.SetString("AccessToken", access_token);

            GitHubClient userClient = GetNewClient(access_token);
            var user = await userClient.User.Current();
            _httpContextAccessor?.HttpContext?.Session.SetString("UserLogin", user.Login);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserAvatarURL", user.AvatarUrl);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserName", user.Name);

            return Redirect($"http://localhost:5173");
        }
    }

    [HttpGet("getUserInfo")]
    public async Task<ActionResult> getUserInfo()
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
    public async Task<ActionResult> logoutUser()
    {
        _httpContextAccessor?.HttpContext?.Session.Clear();
        return Ok();

    }

    [HttpGet("getRepository")]
    public async Task<ActionResult> getRepository()
    {
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


    }

    [HttpGet("getRepository/{id}")] // Update the route to include repository ID
    public async Task<ActionResult> getRepositoryById(int id) // Change the method signature to accept ID
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
                    var pulls = await installationClient.PullRequest.GetAllForRepository(id);
                    foreach (var pull in pulls)
                    {

                        var comments = await installationClient.Issue.Comment.GetAllForIssue(id, pull.Number);
                        var reviews = await installationClient.PullRequest.Review.GetAll(id, pull.Number);
                        Console.WriteLine($"PR Status: {pull.State}");
                        Console.WriteLine($"Comments: {comments.Count}");
                        Console.WriteLine($"Review: {reviews.Count}");
                        foreach (var label in pull.Labels)
                        {
                            Console.WriteLine(label.Name);
                        }

                        foreach (var comm in comments)
                        {
                            Console.WriteLine($"Commenter: {comm.User.Login}");
                            Console.WriteLine($"Comment body: {comm.Body}");
                            Console.WriteLine($"Comment reacts: {comm.Reactions.Hooray}");
                        }

                        foreach (var rev in reviews)
                        {
                            Console.WriteLine($"Reviewer: {rev.User.Login}");
                            Console.WriteLine($"Review State: {rev.State}");
                            Console.WriteLine($"Review body: {rev.Body}");
                        }
                    }
                    return Ok();
                }
                catch (NotFoundException)
                {
                    return NotFound($"Repository with ID {id} not found.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpGet("prs")]
    public async Task<ActionResult> getAllPRs()
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

                    /*
                    foreach( var repoPull in repoPulls ){
                        var pull = await installationClient.PullRequest.Get(repository.Id, repoPull.Number);
                        pullRequests.Add(pull);
                    }
                    */

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

        return Ok(pullRequests);
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
                            label = await installationClient.Issue.Labels.Create(owner, repoName, new NewLabel(labelName, "ffffff"));
                        }

                        // Add the label to the pull request
                        await installationClient.Issue.Labels.AddToIssue(owner, repoName, (int)prnumber, new[] { label.Name });
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
                    await installationClient.Issue.Labels.RemoveFromIssue(owner, repoName, (int)prnumber, labelName);
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
                    var pull = await installationClient.PullRequest.ReviewRequest.Create(owner, repoName, (int)prnumber, reviewRequest);
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
                    await installationClient.PullRequest.ReviewRequest.Delete(owner, repoName, (int)prnumber, reviewRequest);
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
        await client.Issue.Comment.Create(owner, repoName, prnumber, commentBody);
        return Ok($"Comment added to pull request #{prnumber} in repository {repoName}.");   
    }
    
    [HttpPatch("pullrequest/{owner}/{repoName}/{comment_id}/updateComment")]
    public async Task<ActionResult> UpdateComment(string owner, string repoName, int comment_id, [FromBody] string commentBody)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        await client.Issue.Comment.Update(owner, repoName, comment_id, commentBody);
        return Ok($"Comment updated."); 
    } 

    [HttpDelete("pullrequest/{owner}/{repoName}/{comment_id}/deleteComment")]
    public async Task<ActionResult> DeleteComment(string owner, string repoName, int comment_id)
    {
        var client = _getGitHubClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        await client.Issue.Comment.Delete(owner, repoName, comment_id);
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
                        var commentObj = new IssueCommentInfo
                        {
                            id = comm.Id,
                            author = comm.User.Login,
                            body = comm.Body,
                            created_at = comm.CreatedAt,
                            updated_at = comm.UpdatedAt,
                            association = comm.AuthorAssociation.StringValue
                        };

                        result.Add(commentObj);

                        // Add the comment ID to the set of processed IDs
                        processedCommentIds.Add(comm.Id);
                    }

                }

            }
        }

        return Ok(result);
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_review_comments")]
    public async Task<ActionResult> getRevCommentsOnPR( string owner, string repoName, int prnumber)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<IssueCommentInfo>([]);
        var processedCommentIds = new HashSet<long>();

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
                        var commentObj = new IssueCommentInfo
                        {
                            id = rev.Id,
                            author = rev.User.Login,
                            body = rev.Body,
                            created_at = rev.CreatedAt,
                            updated_at = rev.UpdatedAt,
                            association = rev.AuthorAssociation.StringValue
                        };

                        result.Add(commentObj);

                        // Add the comment ID to the set of processed IDs
                        processedCommentIds.Add(rev.Id);
                    }

                }

            }
        }

        return Ok(result);
    }

    [HttpGet("pullrequest/{owner}/{repoName}/{prnumber}/get_commits")]
    public async Task<ActionResult> getCommits(string owner, string repoName, int prnumber) {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");
        var processedCommitIds = new HashSet<string>();
        var result = new List<CommitsList>([]);

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

                    bool dateExists = result.Any(temp => temp.date == commit.Commit.Author.Date.ToString("yyyy/MM/dd") );

                    if( !dateExists )
                    {
                        result.Add(new CommitsList
                        {
                            date = commit.Commit.Author.Date.ToString("yyyy/MM/dd"),
                            commits = []
                        });
                    }

                    int indexOfDate = result.FindIndex(temp => temp.date == commit.Commit.Author.Date.ToString("yyyy/MM/dd") );

                    if ( commit.Commit.Message.Contains('\n') ){
                        string split_here = "\n\n";
                        string[] message = commit.Commit.Message.Split(split_here);
                        obj = new CommitInfo
                        {
                            title = message[0],
                            description =  message[1],
                            author = commit.Author.Login,
                        };

                    } else {
                        obj = new CommitInfo
                        {
                            title = commit.Commit.Message,
                            description = null,
                            author = commit.Author.Login,
                        };
                    }

                    result[indexOfDate].commits?.Add(obj);

                    processedCommitIds.Add(commit.NodeId);                    
                    
                }                

            }
        }

        return Ok(result);
    }

    [HttpGet("getRepositoryContributors/{owner}/{repoName}")]
    public async Task<ActionResult> getRepositoryContributors(string owner, string repoName)
    {
        var appClient = GetNewClient();
        var userClient = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent();
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        var result = new List<ContributorInfo>();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = GetNewClient(response.Token);

                try
                {
                    var contributors = await installationClient.Repository.GetAllContributors(owner, repoName);

                    foreach (var contributor in contributors)
                    {
                        if (contributor.Login == userLogin)
                            continue; // Skip the logged-in user
                        
                        result.Add(new ContributorInfo
                        {
                            Id = contributor.Id,
                            Login = contributor.Login,
                            AvatarUrl = contributor.AvatarUrl,
                            Contributions = contributor.Contributions
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

}
