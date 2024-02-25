using CS.Core.Entities;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github/repository")]
[ApiController]

public class GitHubRepositoryController : GithubBaseController
{
    public GitHubRepositoryController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
    }

    [HttpGet]
    public async Task<ActionResult> getRepository()
    {
        string? access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        string? userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var userClient = GetNewClient(access_token);
        var appClient = GetNewClient();

        // Get organizations for the current user
        var organizations = await userClient.Organization.GetAllForCurrent(); // organization.Login gibi data çekebiliyoruz
        var organizationLogins = organizations.Select(org => org.Login).ToArray();

        // Store all repositories
        var allRepos = new List<RepoInfo>();

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin || organizationLogins.Contains(installation.Account.Login))
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
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

    [HttpGet("{id}")] // Update the route to include repository ID
    public async Task<ActionResult> getRepositoryById(int id) // Change the method signature to accept ID
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

    [HttpGet("{owner}/{repoName}/contributors")]
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
