using CS.Core.Entities;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github/commit")]
[ApiController]

public class GitHubCommitController : GithubBaseController
{
    public GitHubCommitController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
    }

    [HttpGet("{owner}/{repoName}/{prnumber}/all")]
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
                            githubLink = link + commit.Sha
                        };

                    }
                    else
                    {
                        obj = new CommitInfo
                        {
                            title = commit.Commit.Message,
                            description = null,
                            author = commit.Author.Login,
                            githubLink = link + commit.Sha
                        };
                    }

                    result[indexOfDate].commits?.Add(obj);

                    processedCommitIds.Add(commit.NodeId);

                }
            }

        }

        return Ok(result);
    }

}
