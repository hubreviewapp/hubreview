using System;
using System.IO;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using CS.Core.Configuration;
using CS.Core.Entities;
using CS.Core.Entities.Payloads;
using DotEnv.Core;
using GitHubJwt;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Npgsql;
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
            _client = new GitHubClient(new Octokit.ProductHeaderValue("HubReviewApp"))
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
                    if(installationPayload.action == "created"){

                        Console.WriteLine("\ninstall");
                        Console.WriteLine(installationPayload.organization?.login);
                        
                    }
                    else if (installationPayload.action == "deleted")
                    {
                        Console.WriteLine("\nuninstall");
                    }
                    //TO DO
                    break;
                case "installation_repositories": // add/remove repo and prs from database on (un)installation of a repo
                    //InstallationRepositoriesPayload
                    var installationRepositoriesPayload = JsonConvert.DeserializeObject<InstallationRepositoriesPayload>(requestBody);
                    
                    var response = await _client.GitHubApps.CreateInstallationToken(installationRepositoriesPayload.installation.id);
                    var installationClient = GetNewClient(response.Token);

                    if (installationRepositoriesPayload.action == "added")
                    {
                        foreach (var repository in installationRepositoriesPayload.repositories_added)
                        {
                            long id = repository.id;
                            string node_id = repository.node_id;

                            string full_name = repository.full_name;
                            string[] parts = full_name.Split('/');
                            string owner = parts[0];
                            string repoName = parts[1];
                                                    

                            Repository repo = await GetRepositoryById(repository.id, installationClient);

                            connection.Open();

                            string query = "INSERT INTO repositoryinfo (id, node_id, name, ownerLogin, created_at) VALUES (@id, @node_id, @repoName, @owner, @created_at)";

                            // GetRepository by id lazım...
                            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                            {
                                command.Parameters.AddWithValue("@id", repository.id);
                                command.Parameters.AddWithValue("@node_id", repository.node_id);
                                command.Parameters.AddWithValue("@owner", owner);
                                command.Parameters.AddWithValue("@repoName", repoName);
                                command.Parameters.AddWithValue("@created_at", repo.CreatedAt.Date.ToString("dd/MM/yyyy"));

                                command.ExecuteNonQuery();
                            }

                            string parameters = "(repoid, pullid, reponame, pullnumber, title, author, authoravatarurl, createdat, updatedat, comments, commits, changedfiles, additions, deletions, draft, state, reviewers, labels, pullurl, repoowner)";
                            //string at_parameters = "(@repoid, @pullid, @reponame, @pullnumber, @title, @author, @authoravatarurl, @createdat, @updatedat, @comments, @commits, @changedfiles, @additions, @deletions, @draft, @state, @reviewers, @labels, @pullurl, @repoowner)";

                            query = "INSERT INTO pullrequestinfo " + parameters + " VALUES "; //+ at_parameters;

                            var repoPulls = await GetRepoPullsById(repository.id, installationClient);
                            
                            if( repoPulls != null ){

                                    foreach (var repoPull in repoPulls)
                                    {   
                                        var pull = await GetPullById(repository.id, repoPull.Number, installationClient);
                                        var requestedReviewers = pull.RequestedReviewers.Any()
                                        ? $"'{{ {string.Join(",", pull.RequestedReviewers.Select(r => $@"""{r.Login}"""))} }}'"
                                        : "'{}'";

                                        var labels = pull.Labels.Any()
                                        ? $"'{{ {string.Join(",", pull.Labels.Select(l => $@"""{l.Name}"""))} }}'"
                                        : "'{}'";

                                        query += $"({repository.id}, {pull.Id}, '{pull.Base.Repository.Name}', {pull.Number}, '{pull.Title}', '{pull.User.Login}', '{pull.User.AvatarUrl}', '{pull.CreatedAt.Date.ToString("dd/MM/yyyy")}', '{pull.UpdatedAt.Date.ToString("dd/MM/yyyy")}', {pull.Comments}, {pull.Commits}, {pull.ChangedFiles}, {pull.Additions}, {pull.Deletions}, {pull.Draft}, '{pull.State.ToString()}', {requestedReviewers}, {labels}, '{pull.Url}', '{pull.Base.Repository.Owner.Login}'), ";
                                    }
                                    query = query.Substring(0, query.Length-2);   
                                    using (var command = new NpgsqlCommand(query, connection))
                                    {
                                        command.ExecuteNonQuery();                    
                                    }           
                            }

                            connection.Close();

                            Console.WriteLine($"Repository {repository.full_name} is added to database.");
                        }
                    }
                    else
                    {
                        // removed
                        foreach (var repository in installationRepositoriesPayload.repositories_removed)
                        {
                            long id = repository.id;

                            connection.Open();

                            string query1 = "DELETE FROM repositoryinfo WHERE id = @id";
                            string query2 = "DELETE FROM pullrequestinfo WHERE repoid = @id";

                            // GetRepository by id lazım...
                            using (NpgsqlCommand command = new NpgsqlCommand(query1, connection))
                            {
                                command.Parameters.AddWithValue("@id", repository.id);

                                command.ExecuteNonQuery();
                            }

                            using (NpgsqlCommand command = new NpgsqlCommand(query2, connection))
                            {
                                command.Parameters.AddWithValue("@id", repository.id);

                                command.ExecuteNonQuery();
                            }

                            connection.Close();

                            Console.WriteLine($"Repository {repository.full_name} is removed from database.");
                        }
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
                case "github_app_authorization":
                    Console.WriteLine("auth revoked");
                    break;
                case "personal_access_token_request":
                    Console.WriteLine("\ntoken request\n");
                    var patRequestPayload = JsonConvert.DeserializeObject<TokenRequestPayload>(requestBody);
                    if( patRequestPayload.action == "created")
                    {
                        Console.WriteLine("\ntoken request\n");
                        Console.WriteLine(requestBody);
                    }
                    break;
            }

            return Ok();
        }


        private static GitHubClient _getGitHubClient(string token)
        {
            return new GitHubClient(new Octokit.ProductHeaderValue("HubReviewApp"))
            {
                Credentials = new Credentials(token, AuthenticationType.Bearer)
            };
        }
        /*
        private GitHubJwtFactory _getGitHubJwtGenerator()
        {
            return new GitHubJwtFactory(
                new FilePrivateKeySource(_reader["PK_RELATIVE_PATH"]),
                new GitHubJwtFactoryOptions
                {
                    AppIntegrationId = _reader.GetIntValue("APP_ID"), // The GitHub App Id
                    ExpirationSeconds = _reader.GetIntValue("EXP_TIME") // 10 minutes is the maximum time allowed
                }
            );
        } */


        private GitHubClient GetNewClient(string? token = null)
        {
            GitHubClient res;

            res = _getGitHubClient(token);

            return res;
        }

        public async Task<Repository> GetRepositoryById(long id, GitHubClient installationClient) // Change the method signature to accept ID
        {
            // Get the repository by ID
            var repository = await installationClient.Repository.Get(id);
            return repository;
        }

        public async Task<IReadOnlyList<PullRequest>?> GetRepoPullsById(long id, GitHubClient installationClient) // Change the method signature to accept ID
        {
            var options = new PullRequestRequest{
                State=ItemStateFilter.All
            };
            // Get the repository by ID
            var pulls = await installationClient.PullRequest.GetAllForRepository(id, options);

            return pulls ?? null;
        }

        public async Task<PullRequest?> GetPullById(long repoid, int prnum, GitHubClient installationClient) // Change the method signature to accept ID
        {
            // Get the repository by ID
            var pull = await installationClient.PullRequest.Get(repoid, prnum);

            return pull;
        }


    }
}
