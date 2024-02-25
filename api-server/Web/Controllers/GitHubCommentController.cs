using CS.Core.Entities;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github/comment")]
[ApiController]

public class GitHubCommentController : GithubBaseController
{
    public GitHubCommentController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
    }

    [HttpPost("{owner}/{repoName}/{prnumber}/add")]
    public async Task<ActionResult> AddCommentToPR(string owner, string repoName, int prnumber, [FromBody] string commentBody)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        await client.Issue.Comment.Create(owner, repoName, prnumber, commentBody);
        return Ok($"Comment added to pull request #{prnumber} in repository {repoName}.");
    }

    [HttpPatch("{owner}/{repoName}/{comment_id}/update")]
    public async Task<ActionResult> UpdateComment(string owner, string repoName, int comment_id, [FromBody] string commentBody)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        await client.Issue.Comment.Update(owner, repoName, comment_id, commentBody);
        return Ok($"Comment updated.");
    }

    [HttpDelete("{owner}/{repoName}/{comment_id}/remove")]
    public async Task<ActionResult> DeleteComment(string owner, string repoName, int comment_id)
    {
        var client = GetNewClient(_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken"));
        await client.Issue.Comment.Delete(owner, repoName, comment_id);
        return Ok($"Comment deleted.");
    }

    [HttpGet("{owner}/{repoName}/{prnumber}/all")]
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

}
