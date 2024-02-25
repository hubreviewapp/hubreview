using CS.Core.Entities;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github/pullrequest")]
[ApiController]

public class GitHubPullRequestController : GithubBaseController
{
    private string GenerateRandomColor()
    {
        var random = new Random();
        var color = String.Format("#{0:X6}", random.Next(0x1000000)); // Generates a random color code in hexadecimal format
        return color;
    }
    public GitHubPullRequestController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
    }

    [HttpGet("all")]
    public async Task<ActionResult> getAllPRs()
    {
        var appClient = GetNewClient();
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

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
                var installationClient = GetNewClient(response.Token);
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

        return Ok(pullRequests);
    }

    [HttpGet("{owner}/{repoName}/{prnumber}")]
    public async Task<ActionResult> getPRById(string owner, string repoName, long prnumber)
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

    [HttpPost("{owner}/{repoName}/{prnumber}/add_label")]
    public async Task<ActionResult> addLabelToPR(string owner, string repoName, long prnumber, [FromBody] string labelName)
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
                    // Get the existing labels of the repository
                    var labels = await installationClient.Issue.Labels.GetAllForRepository(owner, repoName);

                    // Find the label by name
                    var label = labels.FirstOrDefault(l => l.Name.Equals(labelName, StringComparison.OrdinalIgnoreCase));
                    if (label == null)
                    {
                        // If the label does not exist, create it
                        var randomColor = GenerateRandomColor();
                        label = await installationClient.Issue.Labels.Create(owner, repoName, new NewLabel(labelName, "ffffff"));
                    }

                    // Add the label to the pull request
                    await installationClient.Issue.Labels.AddToIssue(owner, repoName, (int)prnumber, [label.Name]);

                    return Ok($"Labels '{labelName}' is added to pull request #{prnumber} in repository {repoName}.");
                }
                catch (NotFoundException)
                {
                    return NotFound($"Pull request with number {prnumber} not found in repository {repoName}.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpDelete("{owner}/{repoName}/{prnumber}/remove_label/{labelName}")]
    public async Task<ActionResult> RemoveLabelFromPR(string owner, string repoName, long prnumber, string labelName)
    {
        var appClient = GetNewClient();

        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));

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
                var installationClient = GetNewClient(response.Token);

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

}
