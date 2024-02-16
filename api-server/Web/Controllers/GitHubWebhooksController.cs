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
                    Console.WriteLine(requestBody);
                    Console.WriteLine($"Received pull request webhook for repository: {payload.repository.id} name: {payload.repository.full_name}");
                    break;
                // more cases to be added
            }

            return Ok();
        }


        // !!!!! Detaylandırılcak

        // Define classes for deserializing payloads
        public class PullRequestPayload
        {
            public string Action { get; set; }
            public PullRequest PullRequest { get; set; }
            public Repository repository { get; set; }
        }

        public class PullRequest
        {
            public int Number { get; set; }
            public string Title { get; set; }
        }

        public class Repository
        {
            public string full_name { get; set; }
            public long id { get; set; }
        }
    }
}
