using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using CS.Core.Entities;
using CS.Core.Entities.Payloads;
using DotEnv.Core;
using GitHubJwt;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Octokit;


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
            Console.WriteLine(requestBody);
            switch (eventType)
            {
                case "check_run":
                    //CheckRunPayload
                    var checkRunPayload = JsonConvert.DeserializeObject<CheckRunPayload>(requestBody);
                    //TO DO
                    break;
                case "commit_comment":
                    //CommitCommentPayload
                    var commitCommentPayload = JsonConvert.DeserializeObject<CS.Core.Entities.Payloads.CommitCommentPayload>(requestBody);
                    //TO DO
                    break;
                case "create":
                    //CreatePayload
                    var createPayload = JsonConvert.DeserializeObject<CreatePayload>(requestBody);
                    //TO DO
                    break;
                case "delete":
                    //DeletePayload
                    var deletePayload = JsonConvert.DeserializeObject<DeletePayload>(requestBody);
                    //TO DO
                    break;
                case "installation":
                    //InstallationPayload
                    var installationPayload = JsonConvert.DeserializeObject<InstallationPayload>(requestBody);
                    //TO DO
                    break;
                case "installation_repositories":
                    //InstallationRepositoriesPayload
                    var installationRepositoriesPayload = JsonConvert.DeserializeObject<InstallationRepositoriesPayload>(requestBody);
                    //TO DO
                    break;
                case "member":
                    //MemberPayload
                    var memberPayload = JsonConvert.DeserializeObject<MemberPayload>(requestBody);
                    //TO DO
                    break;
                case "organization":
                    //OrganizationPayload
                    var organizationPayload = JsonConvert.DeserializeObject<OrganizationPayload>(requestBody);
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
                    var repositoryPayload = JsonConvert.DeserializeObject<RepositoryPayload>(requestBody);
                    //TO DO
                    break;
            }

            return Ok();
        }

    }
}
