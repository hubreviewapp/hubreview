using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Octokit;
using GitHubJwt;
using DotEnv.Core;
using Newtonsoft.Json;
using CS.Core.Entities;


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

        [HttpPost]
        public async Task<IActionResult> Webhook()
        {
            string requestBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                requestBody = await reader.ReadToEndAsync();
            }

            var eventType = Request.Headers["X-GitHub-Event"];
            Console.WriteLine(eventType);
            switch (eventType)
            {
                case "check_run":
                    //CheckRunPayload
                    //TO DO
                    break;
                case "commit_comment":
                    //CommitCommentPayload
                    //TO DO
                    break;
                case "create":
                    //CreatePayload
                    //TO DO
                    break;  
                case "delete":
                    //DeletePayload
                    //TO DO
                    break;  
                case "member":
                    //MemberPayload
                    //TO DO
                    break;
                case "organization":
                    //OrganizationPayload
                    //TO DO
                    break;
                case "pull_request":
                    var pullRequestPayload = JsonConvert.DeserializeObject<PullRequestPayload>(requestBody);
                    //TO DO
                    break;
                case "pull_request_review_comment":
                    var pullRequestReviewCommentPayload = JsonConvert.DeserializeObject<PullRequestReviewCommentPayload>(requestBody);
                    //TO DO
                    break;
                case "pull_request_review":
                    var pullRequestReviewPayload = JsonConvert.DeserializeObject<PullRequestReviewPayload>(requestBody);
                    //TO DO
                    break;
                case "pull_request_review_thread":
                    var pullRequestReviewThreadPayload = JsonConvert.DeserializeObject<PullRequestReviewThreadPayload>(requestBody);
                    //TO DO
                    break;
                case "repository":
                    //RepositoryPayload
                    //TO DO
                    break;
            }

            return Ok();
        }

    }
}
