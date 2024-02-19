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
                    var pullRequestPayload = JsonConvert.DeserializeObject<PullRequestPayload>(requestBody);
                    //Console.WriteLine(requestBody);
                    Console.WriteLine($"Received pull request webhook for repository: {pullRequestPayload?.repository?.id} name: {pullRequestPayload?.repository?.full_name} test: {pullRequestPayload?.pull_request?.@base?.label}");
                    break;
                case "pull_request_review_comment":
                    var pullRequestReviewCommentPayload = JsonConvert.DeserializeObject<PullRequestReviewCommentPayload>(requestBody);
                    Console.WriteLine(requestBody);
                    Console.WriteLine($"Action: {pullRequestReviewCommentPayload?.action} Comment: {pullRequestReviewCommentPayload?.comment?.@body}");
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

    }
}
