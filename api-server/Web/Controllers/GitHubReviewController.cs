using CS.Core.Entities;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github/review")]
[ApiController]

public class GitHubReviewController : GithubBaseController
{
    public GitHubReviewController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
    }

    [HttpPost("{owner}/{repoName}/{prnumber}/request")]
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

    [HttpDelete("{owner}/{repoName}/{prnumber}/remove/{reviewer}")]
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

    [HttpGet("{owner}/{repoName}/{prnumber}/all")]
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

}
