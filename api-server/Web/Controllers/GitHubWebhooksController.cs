using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Octokit;
using GitHubJwt;
using DotEnv.Core;
using Newtonsoft.Json;


namespace CS.Web.Controllers
{

    [Route("api/github/webhooks")]
    [ApiController]
    public class GitHubWebhooksController : ControllerBase
    {
        private readonly GitHubClient _client;

        public GitHubWebhooksController()
        {
            GitHubJwtFactory generator = new GitHubJwtFactory(
                                                                new FilePrivateKeySource("../../api-server/hubreviewapp.2024-02-02.private-key.pem"),
                                                                new GitHubJwtFactoryOptions
                                                                {
                                                                    AppIntegrationId = 812902,
                                                                    ExpirationSeconds = 300
                                                                }
                                                            );
            string jwtToken = generator.CreateEncodedJwtToken();
            _client = new GitHubClient(new ProductHeaderValue("HubReviewApp"))
                    {
                        Credentials = new Credentials(jwtToken, AuthenticationType.Bearer)
                    };
        }

        // Right now just for testing purposes
        [HttpGet]
        public async Task<ActionResult> getUserInfo() {
            Console.WriteLine("Hellooo");
            return Ok();
        }

        [HttpPost]
        public async Task<IActionResult> Webhook()
        {
            Console.WriteLine("Hello World");
            string requestBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                requestBody = await reader.ReadToEndAsync();
            }

            var eventType = Request.Headers["X-GitHub-Event"];
            switch (eventType)
            {
                case "ping":
                    return Ok("pong");
                case "pull_request":
                    var payload = JsonConvert.DeserializeObject<PullRequestPayload>(requestBody);
                    //Console.WriteLine(requestBody);
                    Console.WriteLine($"Received pull request webhook for repository: {payload.repository.id} name: {payload.repository.full_name} test: {payload.pull_request.@base.label}");
                    break;
                case "pull_request_review_comment":
                    Console.WriteLine(requestBody);
                    break;
                case "pull_request_review":
                    Console.WriteLine(requestBody);
                    Console.WriteLine("review");
                    break;
                case "pull_request_review_thread":
                    Console.WriteLine(requestBody);
                    Console.WriteLine("thread");
                    break;
                // more cases to be added
            }

            return Ok();
        }

        public class UserInfo
        {
            public string avatar_url { get; set; }
            public bool deleted { get; set; }
            public string email { get; set; }
            public string events_url { get; set; }
            public string followers_url { get; set; }
            public string following_url { get; set; }
            public string gists_url { get; set; }
            public string gravatar_id { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string login { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string organizations_url { get; set; }
            public string received_events_url { get; set; }
            public string repos_url { get; set; }
            public bool site_admin { get; set; }
            public string starred_url { get; set; }
            public string subscriptions_url { get; set; }
            public string type { get; set; }
            public string url { get; set; }
        }

        public class InstallationInfo
        {
            public int id { get; set; }
            public string node_id { get; set; }
        }
        public class OrganizationInfo
        {
            public string login { get; set; }
            public int id { get; set; }
            public string node_id { get; set; }
            public string url { get; set; }
            public string repos_url { get; set; }
            public string events_url { get; set; }
            public string hooks_url { get; set; }
            public string issues_url { get; set; }
            public string members_url { get; set; }
            public string public_members_url { get; set; }
            public string avatar_url { get; set; }
            public string description { get; set; }
        }

        public class SenderInfo
        {
            public string login { get; set; }
            public int id { get; set; }
            public string node_id { get; set; }
            public string avatar_url { get; set; }
            public string gravatar_id { get; set; }
            public string url { get; set; }
            public string html_url { get; set; }
            public string followers_url { get; set; }
            public string following_url { get; set; }
            public string gists_url { get; set; }
            public string starred_url { get; set; }
            public string subscriptions_url { get; set; }
            public string organizations_url { get; set; }
            public string repos_url { get; set; }
            public string events_url { get; set; }
            public string received_events_url { get; set; }
            public string type { get; set; }
            public bool site_admin { get; set; }
        }

        public class PullRequestInfo
        {
            public LinksInfo _links { get; set; }
            public string active_lock_reason { get; set; }
            public int additions { get; set; }
            public UserInfo assignee { get; set; }
            public UserInfo[] assignees { get; set; }
            public string author_association { get; set; }
            public AutoMergeInfo auto_merge { get; set; }
            
            public BaseInfo @base { get; set; }
            public string body { get; set; }
            public int changed_files { get; set; }
            public string closed_at { get; set; }
            public int comments { get; set; }
            public string comments_url { get; set; }
            public int commits { get; set; }
            public string commits_url { get; set; }
            public string created_at { get; set; }
            public int deletions { get; set; }
            public string diff_url { get; set; }
            public bool draft { get; set; }
            public BaseInfo head { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public LabelInfo[] labels { get; set; }
            public bool locked { get; set; }
            public bool maintainer_can_modify { get; set; }
            public string merge_commit_sha { get; set; }
            public bool? mergeable { get; set; }
            public string mergeable_state { get; set; }
            public bool merged { get; set; }
            public string merged_at { get; set; }
            public UserInfo merged_by { get; set; }
            public MilestoneInfo milestone { get; set; }
            public string node_id { get; set; }
            public int number { get; set; }
            public string patch_url { get; set; }
            public bool? rebaseable { get; set; }
            public UserInfo[] requested_reviewers { get; set; }
            public TeamInfo[] requested_teams { get; set; }
            public string review_comment_url { get; set; }
            public int review_comments { get; set; }
            public string review_comments_url { get; set; }
            public string state { get; set; }
            public string statuses_url { get; set; }
            public string title { get; set; }
            public string updated_at { get; set; }
            public string url { get; set; }
            public UserInfo user { get; set; }
        }


        // Define classes for deserializing payloads
        public class PullRequestPayload
        {
            public string action { get; set; }
            public UserInfo assignee { get; set; }
            public InstallationInfo installation { get; set; }

            public int number { get; set; }
            public OrganizationInfo organization { get; set; }
            public PullRequestInfo pull_request { get; set; }
            public RepositoryInfo repository { get; set; }
            public SenderInfo sender { get; set; }
        }

        public class LinksInfo
        {
                public CommentsInfo comments { get; set; }
                public CommitsInfo commits { get; set; }
                public HtmlInfo html { get; set; }
                public IssueInfo issue { get; set; }
                public ReviewCommentInfo review_comment { get; set; }
                public ReviewCommentsInfo review_comments { get; set; }
                public SelfInfo self { get; set; }
                public StatusesInfo statuses { get; set; }
        }
                
        public class CommentsInfo
        {
            public string href { get; set; }
        }

        public class CommitsInfo
        {
            public string href { get; set; }
        }

        public class HtmlInfo
        {
            public string href { get; set; }
        }

        public class IssueInfo
        {
            public string href { get; set; }
        }

        public class ReviewCommentInfo
        {
            public string href { get; set; }
        }

        public class ReviewCommentsInfo
        {
            public string href { get; set; }
        }

        public class SelfInfo
        {
            public string href { get; set; }
        }

        public class StatusesInfo
        {
            public string href { get; set; }
        }
        public class AutoMergeInfo
        {
            public string commit_message { get; set; }
            public string commit_title { get; set; }
            public EnabledByInfo enabled_by { get; set; }
            public string merge_method { get; set; }
        }

        public class EnabledByInfo
        {
            public string avatar_url { get; set; }
            public bool deleted { get; set; }
            public string email { get; set; }
            public string events_url { get; set; }
            public string followers_url { get; set; }
            public string following_url { get; set; }
            public string gists_url { get; set; }
            public string gravatar_id { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string login { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string organizations_url { get; set; }
            public string received_events_url { get; set; }
            public string repos_url { get; set; }
            public bool site_admin { get; set; }
            public string starred_url { get; set; }
            public string subscriptions_url { get; set; }
            public string type { get; set; }
            public string url { get; set; }
        }

        public class BaseInfo
        {
            public string label { get; set; }
            public string @ref { get; set; }
            public RepositoryInfo repo { get; set; }
            public string sha { get; set; }
            public UserInfo user { get; set; }
        }

        public class LabelInfo
        {
            public string color { get; set; }
            public bool @default { get; set; }
            public string description { get; set; }
            public int id { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string url { get; set; }
        }

        public class MilestoneInfo
        {
            public string closed_at { get; set; }
            public int closed_issues { get; set; }
            public string created_at { get; set; }
            public CreatorInfo creator { get; set; }
            public string description { get; set; }
            public string due_on { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string labels_url { get; set; }
            public string node_id { get; set; }
            public int number { get; set; }
            public int open_issues { get; set; }
            public string state { get; set; }
            public string title { get; set; }
            public string updated_at { get; set; }
            public string url { get; set; }
        }

        public class TeamInfo
        {
            public bool deleted { get; set; }
            public string description { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string members_url { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public ParentInfo parent { get; set; }
            public string permission { get; set; }
            public string privacy { get; set; }
            public string repositories_url { get; set; }
            public string slug { get; set; }
            public string url { get; set; }
        }

        public class CreatorInfo
        {
            public string avatar_url { get; set; }
            public bool deleted { get; set; }
            public string email { get; set; }
            public string events_url { get; set; }
            public string followers_url { get; set; }
            public string following_url { get; set; }
            public string gists_url { get; set; }
            public string gravatar_id { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string login { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string organizations_url { get; set; }
            public string received_events_url { get; set; }
            public string repos_url { get; set; }
            public bool site_admin { get; set; }
            public string starred_url { get; set; }
            public string subscriptions_url { get; set; }
            public string type { get; set; }
            public string url { get; set; }
        }
        public class ParentInfo
        {
            public string description { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public string members_url { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string permission { get; set; }
            public string privacy { get; set; }
            public string repositories_url { get; set; }
            public string slug { get; set; }
            public string url { get; set; }
        }

        public class RepositoryInfo
        {
            public bool allow_auto_merge { get; set; }
            public bool allow_forking { get; set; }
            public bool allow_merge_commit { get; set; }
            public bool allow_rebase_merge { get; set; }
            public bool allow_squash_merge { get; set; }
            public bool allow_update_branch { get; set; }
            public string archive_url { get; set; }
            public bool archived { get; set; }
            public string assignees_url { get; set; }
            public string blobs_url { get; set; }
            public string branches_url { get; set; }
            public string clone_url { get; set; }
            public string collaborators_url { get; set; }
            public string comments_url { get; set; }
            public string commits_url { get; set; }
            public string compare_url { get; set; }
            public string contents_url { get; set; }
            public string contributors_url { get; set; }
            public string created_at { get; set; }
            public string default_branch { get; set; }
            public bool delete_branch_on_merge { get; set; }
            public string deployments_url { get; set; }
            public string description { get; set; }
            public bool disabled { get; set; }
            public string downloads_url { get; set; }
            public string events_url { get; set; }
            public bool fork { get; set; }
            public int forks { get; set; }
            public int forks_count { get; set; }
            public string forks_url { get; set; }
            public string full_name { get; set; }
            public string git_commits_url { get; set; }
            public string git_refs_url { get; set; }
            public string git_tags_url { get; set; }
            public string git_url { get; set; }
            public bool has_downloads { get; set; }
            public bool has_issues { get; set; }
            public bool has_pages { get; set; }
            public bool has_projects { get; set; }
            public bool has_wiki { get; set; }
            public bool has_discussions { get; set; }
            public string homepage { get; set; }
            public string hooks_url { get; set; }
            public string html_url { get; set; }
            public int id { get; set; }
            public bool is_template { get; set; }
            public string issue_comment_url { get; set; }
            public string issue_events_url { get; set; }
            public string issues_url { get; set; }
            public string keys_url { get; set; }
            public string labels_url { get; set; }
            public string language { get; set; }
            public string languages_url { get; set; }
            public LicenseInfo license { get; set; }
            public string master_branch { get; set; }
            public string merge_commit_message { get; set; }
            public string merge_commit_title { get; set; }
            public string merges_url { get; set; }
            public string milestones_url { get; set; }
            public string mirror_url { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string notifications_url { get; set; }
            public int open_issues { get; set; }
            public int open_issues_count { get; set; }
            public string organization { get; set; }
            public UserInfo owner { get; set; }
            public PermissionsInfo permissions { get; set; }
            public bool @private { get; set; }
            public bool @public { get; set; }
            public string pulls_url { get; set; }
            public string pushed_at { get; set; }
            public string releases_url { get; set; }
            public string role_name { get; set; }
            public int size { get; set; }
            public string squash_merge_commit_message { get; set; }
            public string squash_merge_commit_title { get; set; }
            public string ssh_url { get; set; }
            public int stargazers { get; set; }
            public int stargazers_count { get; set; }
            public string stargazers_url { get; set; }
            public string statuses_url { get; set; }
            public string subscribers_url { get; set; }
            public string subscription_url { get; set; }
            public string svn_url { get; set; }
            public string tags_url { get; set; }
            public string teams_url { get; set; }
            public string[] topics { get; set; }
            public string trees_url { get; set; }
            public string updated_at { get; set; }
            public string url { get; set; }
            public bool use_squash_pr_title_as_default { get; set; }
            public string visibility { get; set; }
            public int watchers { get; set; }
            public int watchers_count { get; set; }
            public bool web_commit_signoff_required { get; set; }
        }

        public class LicenseInfo
        {
            public string key { get; set; }
            public string name { get; set; }
            public string node_id { get; set; }
            public string spdx_id { get; set; }
            public string url { get; set; }
        }

        public class PermissionsInfo
        {
            public bool admin { get; set; }
            public bool maintain { get; set; }
            public bool pull { get; set; }
            public bool push { get; set; }
            public bool triage { get; set; }
        }
    }
}
