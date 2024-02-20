using System.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Octokit;
using DotEnv.Core;
using GitHubJwt;
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

        return Ok( pullRequests );
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
    public async Task<ActionResult> requestReview(string owner, string repoName, long prnumber, [FromBody] string[] reviewers){

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
                    var pull = await installationClient.PullRequest.ReviewRequest.Create(owner, repoName, (int) prnumber, reviewRequest);
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
}


