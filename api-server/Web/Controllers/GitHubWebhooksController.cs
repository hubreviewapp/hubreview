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
using CS.Core.Entities.Payloads;
using CS.Core.Configuration;
using Npgsql;



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

            var config = new CoreConfiguration();
            string connectionString = config.DbConnectionString;

            using var connection = new NpgsqlConnection(connectionString);
            
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
                    if ( installationRepositoriesPayload.action == "added" ){
                        // added
                        foreach (var repository in installationRepositoriesPayload.repositories_added){
                            long id = repository.id;
                            string node_id = repository.node_id;

                            string full_name = repository.full_name;
                            string[] parts = full_name.Split('/');
                            string owner = parts[0];
                            string repoName = parts[1];
                            string updated_at = repository.updated_at;
                            string created_at = repository.created_at; 

                            Console.WriteLine( repository.node_id );
                            Console.WriteLine( repository.updated_at );

                            Console.WriteLine( repository.created_at );

                            connection.Open();

                            string query = "INSERT INTO repositories (id, node_id, name, ownerLogin, created_at, updated_at) VALUES (@id, @node_id, @repoName, @owner, @created_at, @updated_at)";
                            
                            // GetRepository by id lazım...
                            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                            {
                                command.Parameters.AddWithValue("@id", repository.id);
                                command.Parameters.AddWithValue("@node_id", repository.node_id);
                                command.Parameters.AddWithValue("@owner", owner);
                                command.Parameters.AddWithValue("@repoName", repoName);
                                //command.Parameters.AddWithValue("@updated_at", repository.updated_at);
                                //command.Parameters.AddWithValue("@created_at", repository.created_at);
                                
                                command.ExecuteNonQuery();
                            }
                        }
                    }else {
                        // removed
                    }

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
