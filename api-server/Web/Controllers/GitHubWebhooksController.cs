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

                            string sender = installationRepositoriesPayload.sender.login;
                                                    

                            Repository repo = await GetRepositoryById(repository.id, sender);

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
                            string at_parameters = "(@repoid, @pullid, @reponame, @pullnumber, @title, @author, @authoravatarurl, @createdat, @updatedat, @comments, @commits, @changedfiles, @additions, @deletions, @draft, @state, @reviewers, @labels, @pullurl, @repoowner)";

                            query = "INSERT INTO pullrequestinfo " + parameters + " VALUES " + at_parameters;

                            var repoPulls = await GetRepoPullsById(repository.id, sender);

                            if( repoPulls != null ){
                                using (var command = new NpgsqlCommand(query, connection))
                                {
                                    foreach (var repoPull in repoPulls)
                                    {
                                        var pull = await GetPullById(repository.id, repoPull.Number, sender);
                                        if( pull == null ){
                                            Console.WriteLine($"No pull request #{repoPull.Number} under {repository.full_name} is found.");
                                        }
                                        command.Parameters.AddWithValue("@repoid", repository.id);
                                        command.Parameters.AddWithValue("@pullid", pull.Id);
                                        command.Parameters.AddWithValue("@reponame", pull.Base.Repository.Name);
                                        command.Parameters.AddWithValue("@pullnumber", pull.Number);
                                        command.Parameters.AddWithValue("@title", pull.Title);
                                        command.Parameters.AddWithValue("@author", pull.User.Login);
                                        command.Parameters.AddWithValue("@authoravatarurl", pull.User.AvatarUrl);
                                        command.Parameters.AddWithValue("@createdat", pull.CreatedAt.Date.ToString("dd/MM/yyyy"));
                                        command.Parameters.AddWithValue("@updatedat", pull.UpdatedAt.Date.ToString("dd/MM/yyyy"));
                                        command.Parameters.AddWithValue("@comments", pull.Comments);
                                        command.Parameters.AddWithValue("@commits", pull.Commits);
                                        command.Parameters.AddWithValue("@changedfiles", pull.ChangedFiles);
                                        command.Parameters.AddWithValue("@additions", pull.Additions);
                                        command.Parameters.AddWithValue("@deletions", pull.Deletions);
                                        command.Parameters.AddWithValue("@draft", pull.Draft);
                                        command.Parameters.AddWithValue("@state", pull.State.ToString());
                                        command.Parameters.AddWithValue("@reviewers", pull.RequestedReviewers.Select(r => r.Login).ToArray());
                                        command.Parameters.AddWithValue("@labels", pull.Labels.Select(l => l.Name).ToArray());
                                        command.Parameters.AddWithValue("@pullurl", pull.Url);
                                        command.Parameters.AddWithValue("@repoowner", pull.Base.Repository.Owner.Login);

                                        command.ExecuteNonQuery();
                                    }
                                    
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

        public async Task<Repository> GetRepositoryById(long id, string userlogin) // Change the method signature to accept ID
        {
            //var appClient = GetNewClient();

            var userLogin = userlogin;

            var installations = await _client.GitHubApps.GetAllInstallationsForCurrent();
            foreach (var installation in installations)
            {
                if (installation.Account.Login == userLogin)
                {
                    var response = await _client.GitHubApps.CreateInstallationToken(installation.Id);
                    var installationClient = GetNewClient(response.Token);


                    // Get the repository by ID
                    var repository = await installationClient.Repository.Get(id);

                    return repository;
                }
            }
            return null;
        }

        public async Task<IReadOnlyList<PullRequest>?> GetRepoPullsById(long id, string userlogin) // Change the method signature to accept ID
        {
            var installations = await _client.GitHubApps.GetAllInstallationsForCurrent();
            foreach (var installation in installations)
            {
                if (installation.Account.Login == userlogin)
                {
                    var response = await _client.GitHubApps.CreateInstallationToken(installation.Id);
                    var installationClient = GetNewClient(response.Token);


                    // Get the repository by ID
                    var pulls = await installationClient.PullRequest.GetAllForRepository(id);

                    return pulls;
                }
            }
            return null;
        }

        public async Task<PullRequest?> GetPullById(long repoid, int prnum, string userlogin) // Change the method signature to accept ID
        {
            var installations = await _client.GitHubApps.GetAllInstallationsForCurrent();
            foreach (var installation in installations)
            {
                if (installation.Account.Login == userlogin)
                {
                    var response = await _client.GitHubApps.CreateInstallationToken(installation.Id);
                    var installationClient = GetNewClient(response.Token);


                    // Get the repository by ID
                    var pull = await installationClient.PullRequest.Get(repoid, prnum);

                    return pull;
                }
            }
            return null;
        }


    }
}
