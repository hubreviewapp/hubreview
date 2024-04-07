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

            AccessToken response;
            GitHubClient installationClient;

            switch (eventType)
            {
                case "check_run": // DONE :D
                    //CheckRunPayload
                    var checkRunPayload = JsonConvert.DeserializeObject<CheckRunPayload>(requestBody);
                    Console.WriteLine("action: " + checkRunPayload.action);
                    response = await _client.GitHubApps.CreateInstallationToken(checkRunPayload.installation.id);
                    installationClient = GetNewClient(response.Token);
                    if (checkRunPayload.action == "created")
                    {
                        int checks_complete = 0;
                        int checks_success = 0;
                        int checks_fail = 0;
                        string sel_query = $"SELECT checks_complete, checks_success, checks_fail FROM pullrequestinfo WHERE repoid = {checkRunPayload.repository.id} AND pullid = {checkRunPayload.check_run.pull_requests[0].id}";
                        connection.Open();
                        using (var command = new NpgsqlCommand(sel_query, connection))
                        {
                            using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    checks_complete = reader.GetInt16(0);
                                    checks_success = reader.GetInt16(1);
                                    checks_fail = reader.GetInt16(2);

                                }
                            }
                        }
                        connection.Close();

                        // Get all checks for the pull request
                        var checks = await installationClient.Check.Run.GetAllForCheckSuite(
                            checkRunPayload.repository.owner.login,
                            checkRunPayload.repository.name,
                            checkRunPayload.check_run.check_suite.id
                        );

                        var checksList = new List<object>();

                        foreach (var check in checks.CheckRuns)
                        {
                            Console.WriteLine($"Check Name: {check.Name}, Conclusion: {check.Conclusion}, Status: {check.Status}");
                            checksList.Add(new
                            {
                                id = check.Id,
                                name = check.Name,
                                status = check.Status,
                                conclusion = check.Conclusion,
                                url = check.HtmlUrl
                            });

                        }

                        string query = $"UPDATE pullrequestinfo SET checks = '{JsonConvert.SerializeObject(checksList)}' WHERE repoid = {checkRunPayload.repository.id} AND pullid = {checkRunPayload.check_run.pull_requests[0].id}";
                        connection.Open();
                        using (var command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();

                        string complete = (checks_complete <= 0) ? "" : " checks_complete = checks_complete - 1,";
                        string success = (checks_complete == 0) ? "" : " checks_success = 0,";
                        string fail = (checks_fail == 0) ? "" : " checks_fail = 0,";

                        string query2 = $"UPDATE pullrequestinfo SET{complete}{success}{fail} checks_incomplete = checks_incomplete + 1  WHERE repoid = {checkRunPayload.repository.id} AND pullid = {checkRunPayload.check_run.pull_requests[0].id}";
                        Console.WriteLine("check action: created \n" + query2);
                        connection.Open();
                        using (var command = new NpgsqlCommand(query2, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();

                    }
                    else if (checkRunPayload.action == "completed")
                    {
                        int checks_complete = 0;
                        int checks_incomplete = 0;
                        string sel_query = $"SELECT checks_complete, checks_incomplete FROM pullrequestinfo WHERE repoid = {checkRunPayload.repository.id} AND pullid = {checkRunPayload.check_run.pull_requests[0].id}";
                        connection.Open();
                        using (var command = new NpgsqlCommand(sel_query, connection))
                        {
                            using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    checks_complete = reader.GetInt16(0);
                                    checks_incomplete = reader.GetInt16(1);
                                }
                            }
                        }
                        connection.Close();

                        // Get all checks for the pull request
                        var checks = await installationClient.Check.Run.GetAllForCheckSuite(
                            checkRunPayload.repository.owner.login,
                            checkRunPayload.repository.name,
                            checkRunPayload.check_run.check_suite.id
                        );

                        var checksList = new List<object>();

                        foreach (var check in checks.CheckRuns)
                        {
                            Console.WriteLine($"Check Name: {check.Name}, Conclusion: {check.Conclusion}, Status: {check.Status}");
                            checksList.Add(new
                            {
                                id = check.Id,
                                name = check.Name,
                                status = check.Status,
                                conclusion = check.Conclusion,
                                url = check.HtmlUrl
                            });

                        }

                        string set_checks = $"checks = '{JsonConvert.SerializeObject(checksList)}'";
                        string set_checks_incomplete = (checks_incomplete <= 0) ? "" : " checks_incomplete = checks_incomplete - 1,";
                        string set_checks_complete = "checks_complete = checks_complete + 1";
                        string set_checks_conclusion = "";

                        if (checkRunPayload.check_run.conclusion == "success")
                        {
                            set_checks_conclusion = "checks_success = checks_success + 1";
                        }
                        else
                        {
                            set_checks_conclusion = "checks_fail = checks_fail + 1";
                        }

                        string where = $"repoid = {checkRunPayload.repository.id} AND pullid = {checkRunPayload.check_run.pull_requests[0].id}";

                        string query = $"UPDATE pullrequestinfo SET {set_checks},{set_checks_incomplete} {set_checks_complete}, {set_checks_conclusion} WHERE {where}";
                        Console.WriteLine($"check action: completed \n SET{set_checks_incomplete} {set_checks_complete}, {set_checks_conclusion}");

                        connection.Open();
                        using (var command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();

                    }

                    break;
                case "installation": // DONE
                    //InstallationPayload
                    var installationPayload = JsonConvert.DeserializeObject<InstallationPayload>(requestBody);
                    if (installationPayload.action == "created")
                    {
                        response = await _client.GitHubApps.CreateInstallationToken(installationPayload.installation.id);
                        installationClient = GetNewClient(response.Token);

                        foreach (var repository in installationPayload.repositories)
                        {
                            long id = repository.id;
                            string node_id = repository.node_id;

                            string full_name = repository.full_name;
                            string[] parts = full_name.Split('/');
                            string owner = parts[0];
                            string repoName = parts[1];


                            Repository repo = await GetRepositoryById(repository.id, installationClient);

                            connection.Open();

                            string query = $"INSERT INTO repositoryinfo (id, node_id, name, ownerLogin, created_at) VALUES ({id}, '{node_id}', '{repoName}', '{owner}', '{repo.CreatedAt.Date:yyyy-MM-dd}')";
                            string comm_query = "INSERT INTO comments (commentid, reponame, prnumber, is_review) VALUES";
                            string review_head_query = "INSERT INTO reviewhead (review_id, reponame, prnumber, body, verdict, comments) VALUES";

                            // GetRepository by id lazım...
                            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            string parameters = "(repoid, pullid, reponame, pullnumber, title, author, authoravatarurl, createdat, updatedat, comments, commits, changedfiles, additions, deletions, draft, merged, state, reviewers, labels, pullurl, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, priority)";

                            query = "INSERT INTO pullrequestinfo " + parameters + " VALUES "; //+ at_parameters;

                            var repoPulls = await GetRepoPullsById(repository.id, installationClient);
                            int priority = 0;
                            if (repoPulls.Count != 0)
                            {
                                foreach (var repoPull in repoPulls)
                                {
                                    var pull = await GetPullById(repository.id, repoPull.Number, installationClient);
                                    var requestedReviewers = pull.RequestedReviewers.Any()
                                    ? $"'{{ {string.Join(",", pull.RequestedReviewers.Select(r => $@"""{r.Login}"""))} }}'"
                                    : "'{}'";

                                    var labels = new List<object>();
                                    foreach (var label in pull.Labels)
                                    {
                                        labels.Add(new
                                        {
                                            id = label.Id,
                                            name = label.Name,
                                            color = label.Color
                                        });

                                        // Set priority based on label name
                                        switch (label.Name)
                                        {
                                            case "Priority: Critical":
                                                priority = 4;
                                                break;
                                            case "Priority: High":
                                                priority = 3;
                                                break;
                                            case "Priority: Medium":
                                                priority = 2;
                                                break;
                                            case "Priority: Low":
                                                priority = 1;
                                                break;
                                            default:
                                                // Do nothing
                                                break;
                                        }
                                    }

                                    int checks_complete_count = 0;
                                    int checks_incomplete_count = 0;
                                    int checks_success_count = 0;
                                    int checks_fail_count = 0;

                                    // Get the check suite ID for the pull request
                                    var checkSuites = await installationClient.Check.Suite.GetAllForReference(
                                        installationPayload.installation.account.login,
                                        repository.name,
                                        pull.Head.Sha
                                    );

                                    var checksList = new List<object>();

                                    //var checkSuiteId = checkSuites.CheckSuites.Last().Id;
                                    var checkSuiteId = checkSuites.CheckSuites.Any()
                                        ? checkSuites.CheckSuites.Last().Id
                                        : -1;

                                    if (checkSuiteId != -1)
                                    {
                                        var checks = await installationClient.Check.Run.GetAllForCheckSuite(
                                            installationPayload.installation.account.login,
                                            repository.name,
                                            checkSuiteId
                                        );



                                        foreach (var check in checks.CheckRuns)
                                        {
                                            if (check.Status == "completed")
                                            {
                                                checks_complete_count++;
                                                if (check.Conclusion == "success")
                                                {
                                                    checks_success_count++;
                                                }
                                                else if (check.Conclusion == "failure")
                                                {
                                                    checks_fail_count++;
                                                }
                                            }
                                            else
                                            {
                                                checks_incomplete_count++;
                                            }
                                            checksList.Add(new
                                            {
                                                id = check.Id,
                                                name = check.Name,
                                                status = check.Status,
                                                conclusion = check.Conclusion,
                                                url = check.HtmlUrl
                                            });

                                        }
                                    }

                                    var labeljson = JsonConvert.SerializeObject(labels);

                                    var assignedReviewers = pull.Assignees.Any()
                                        ? $"'{{ {string.Join(",", pull.Assignees.Select(r => $@"""{r.Login}"""))} }}'"
                                        : "'{}'";



                                    // Get all reviews for the pull request
                                    var installationReviews = await installationClient.PullRequest.Review.GetAll(
                                        installationPayload.installation.account.login,
                                        repository.name,
                                        pull.Number);

                                    var installationLatestReviewsByUser = installationReviews
                                        .GroupBy(r => r.User.Login)
                                        .Select(g => g.OrderByDescending(r => r.SubmittedAt).First())
                                        .ToList();

                                    var installationLatestReviews = new List<object>();
                                    foreach (var review in installationLatestReviewsByUser)
                                    {
                                        //Console.WriteLine($"Latest Review State: {review.State}, User: {review.User.Login}");

                                        installationLatestReviews.Add(
                                            new
                                            {
                                                login = review.User.Login,
                                                state = review.State.ToString()
                                            }
                                        );
                                    }

                                    var installationReviewsJson = JsonConvert.SerializeObject(installationLatestReviews);


                                    query += $"({repository.id}, {pull.Id}, '{pull.Base.Repository.Name}', {pull.Number}, '{pull.Title}', '{pull.User.Login}', '{pull.User.AvatarUrl}', '{pull.CreatedAt.Date:yyyy-MM-dd}', '{pull.UpdatedAt.Date:yyyy-MM-dd}', {pull.Comments}, {pull.Commits}, {pull.ChangedFiles}, {pull.Additions}, {pull.Deletions}, {pull.Draft}, {pull.Merged}, '{pull.State.StringValue}', {requestedReviewers}, '{labeljson}', '{pull.Url}', '{pull.Base.Repository.Owner.Login}', '{JsonConvert.SerializeObject(checksList)}', {checks_complete_count}, {checks_incomplete_count}, {checks_success_count}, {checks_fail_count}, {assignedReviewers}, '{installationReviewsJson}', {priority}), ";

                                    var comments = await installationClient.Issue.Comment.GetAllForIssue(repository.id, repoPull.Number);
                                    foreach (var comm in comments)
                                    {
                                        comm_query += $" ({comm.Id}, '{repository.name}', {pull.Number}, {false}),";
                                    }

                                    var reviewheads = await installationClient.PullRequest.Review.GetAll(owner, repoName, pull.Number);
                                    foreach (var review in reviewheads)
                                    {
                                        var published_comments = await installationClient.PullRequest.Review.GetAllComments(owner, repoName, pull.Number, review.Id);
                                        var comment_id_list = string.Join(",", published_comments.Select(c => c.Id));

                                        review_head_query += $" ({review.Id}, '{repoName}', {pull.Number}, '{review.Body.Replace("'", "''")}', '{review.State.StringValue}', ARRAY[{comment_id_list}]::bigint[]),";

                                        foreach (var revcomm in published_comments)
                                        {
                                            comm_query += $" ({revcomm.Id}, '{repository.name}', {pull.Number}, {true}),";
                                        }

                                    }

                                }
                                query = query[..^2];
                                using (var command = new NpgsqlCommand(query, connection))
                                {
                                    command.ExecuteNonQuery();
                                }

                                review_head_query = review_head_query[..^1];
                                Console.WriteLine(review_head_query);
                                using (var command = new NpgsqlCommand(review_head_query, connection))
                                {
                                    command.ExecuteNonQuery();
                                }

                                comm_query = comm_query[..^1];
                                using (var command = new NpgsqlCommand(comm_query, connection))
                                {
                                    command.ExecuteNonQuery();
                                }
                            }

                            connection.Close();

                        }

                        Console.WriteLine($"Selected Repositories {string.Join(", ", installationPayload.repositories.Select(r => r.name))} is added to database.");

                    }
                    else if (installationPayload.action == "deleted")
                    {
                        foreach (var repository in installationPayload.repositories)
                        {
                            long id = repository.id;

                            connection.Open();

                            string query1 = "DELETE FROM repositoryinfo WHERE id = @id";
                            string query2 = "DELETE FROM pullrequestinfo WHERE repoid = @id";
                            string query3 = $"DELETE FROM comments WHERE reponame = '{repository.name}'";
                            string query4 = $"DELETE FROM reviewhead WHERE reponame = '{repository.name}'";


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

                            using (NpgsqlCommand command = new NpgsqlCommand(query3, connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            using (NpgsqlCommand command = new NpgsqlCommand(query4, connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            if (installationPayload.installation.account.type == "User")
                            {
                                string query5 = "DELETE FROM userinfo WHERE userid = @userid";

                                using (NpgsqlCommand command = new NpgsqlCommand(query5, connection))
                                {
                                    command.Parameters.AddWithValue("@userid", installationPayload.installation.account.id);

                                    command.ExecuteNonQuery();
                                }
                            }

                            connection.Close();


                        }
                        Console.WriteLine($"User {installationPayload.installation.account.login} is removed from database (Uninstall).");
                    }

                    break;
                case "installation_repositories": // DONE
                    //InstallationRepositoriesPayload
                    var installationRepositoriesPayload = JsonConvert.DeserializeObject<InstallationRepositoriesPayload>(requestBody);

                    response = await _client.GitHubApps.CreateInstallationToken(installationRepositoriesPayload.installation.id);
                    installationClient = GetNewClient(response.Token);

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

                            string query = "INSERT INTO repositoryinfo (id, node_id, name, ownerLogin, created_at) VALUES (@id, @node_id, @repoName, @owner, to_date(@created_at, 'yyyy-MM-dd'))";

                            // GetRepository by id lazım...
                            using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                            {
                                command.Parameters.AddWithValue("@id", repository.id);
                                command.Parameters.AddWithValue("@node_id", repository.node_id);
                                command.Parameters.AddWithValue("@owner", owner);
                                command.Parameters.AddWithValue("@repoName", repoName);
                                command.Parameters.AddWithValue("@created_at", repo.CreatedAt.Date.ToString("yyyy-MM-dd"));

                                command.ExecuteNonQuery();
                            }

                            string parameters = "(repoid, pullid, reponame, pullnumber, title, author, authoravatarurl, createdat, updatedat, comments, commits, changedfiles, additions, deletions, draft, merged, state, reviewers, labels, pullurl, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, priority)";
                            query = "INSERT INTO pullrequestinfo " + parameters + " VALUES ";
                            string comm_query = "INSERT INTO comments (commentid, reponame, prnumber, is_review) VALUES ";
                            string review_head_query = "INSERT INTO reviewhead (review_id, reponame, prnumber, body, verdict, comments) VALUES";

                            var repoPulls = await GetRepoPullsById(repository.id, installationClient);

                            int priority = 0;
                            if (repoPulls.Count != 0)
                            {

                                foreach (var repoPull in repoPulls)
                                {
                                    var pull = await GetPullById(repository.id, repoPull.Number, installationClient);
                                    var requestedReviewers = pull.RequestedReviewers.Any()
                                    ? $"'{{ {string.Join(",", pull.RequestedReviewers.Select(r => $@"""{r.Login}"""))} }}'"
                                    : "'{}'";

                                    var labels = new List<object>();
                                    foreach (var label in pull.Labels)
                                    {
                                        labels.Add(new
                                        {
                                            id = label.Id,
                                            name = label.Name,
                                            color = label.Color
                                        });

                                        // Set priority based on label name
                                        switch (label.Name)
                                        {
                                            case "Priority: Critical":
                                                priority = 4;
                                                break;
                                            case "Priority: High":
                                                priority = 3;
                                                break;
                                            case "Priority: Medium":
                                                priority = 2;
                                                break;
                                            case "Priority: Low":
                                                priority = 1;
                                                break;
                                            default:
                                                // Do nothing
                                                break;
                                        }
                                    }


                                    int checks_complete_count = 0;
                                    int checks_incomplete_count = 0;
                                    int checks_success_count = 0;
                                    int checks_fail_count = 0;

                                    // Get the check suite ID for the pull request
                                    var checkSuites = await installationClient.Check.Suite.GetAllForReference(
                                        installationRepositoriesPayload.installation.account.login,
                                        repository.name,
                                        pull.Head.Sha
                                    );

                                    var checksList = new List<object>();

                                    //var checkSuiteId = checkSuites.CheckSuites.Last().Id;
                                    var checkSuiteId = checkSuites.CheckSuites.Any()
                                        ? checkSuites.CheckSuites.Last().Id
                                        : -1;

                                    if (checkSuiteId != -1)
                                    {
                                        var checks = await installationClient.Check.Run.GetAllForCheckSuite(
                                            installationRepositoriesPayload.installation.account.login,
                                            repository.name,
                                            checkSuiteId
                                        );



                                        foreach (var check in checks.CheckRuns)
                                        {
                                            if (check.Status == "completed")
                                            {
                                                checks_complete_count++;
                                                if (check.Conclusion == "success")
                                                {
                                                    checks_success_count++;
                                                }
                                                else if (check.Conclusion == "failure")
                                                {
                                                    checks_fail_count++;
                                                }
                                            }
                                            else
                                            {
                                                checks_incomplete_count++;
                                            }
                                            checksList.Add(new
                                            {
                                                id = check.Id,
                                                name = check.Name,
                                                status = check.Status,
                                                conclusion = check.Conclusion,
                                                url = check.HtmlUrl
                                            });

                                        }
                                    }

                                    var labeljson = JsonConvert.SerializeObject(labels);

                                    var assignedReviewers = pull.Assignees.Any()
                                        ? $"'{{ {string.Join(",", pull.Assignees.Select(r => $@"""{r.Login}"""))} }}'"
                                        : "'{}'";



                                    // Get all reviews for the pull request
                                    var installationReviews = await installationClient.PullRequest.Review.GetAll(
                                        installationRepositoriesPayload.installation.account.login,
                                        repository.name,
                                        pull.Number);

                                    var installationLatestReviewsByUser = installationReviews
                                        .GroupBy(r => r.User.Login)
                                        .Select(g => g.OrderByDescending(r => r.SubmittedAt).First())
                                        .ToList();

                                    var installationLatestReviews = new List<object>();
                                    foreach (var review in installationLatestReviewsByUser)
                                    {
                                        //Console.WriteLine($"Latest Review State: {review.State}, User: {review.User.Login}");

                                        installationLatestReviews.Add(
                                            new
                                            {
                                                login = review.User.Login,
                                                state = review.State.ToString()
                                            }
                                        );
                                    }

                                    var installationReviewsJson = JsonConvert.SerializeObject(installationLatestReviews);


                                    query += $"({repository.id}, {pull.Id}, '{pull.Base.Repository.Name}', {pull.Number}, '{pull.Title}', '{pull.User.Login}', '{pull.User.AvatarUrl}', '{pull.CreatedAt.Date:yyyy-MM-dd}', '{pull.UpdatedAt.Date:yyyy-MM-dd}', {pull.Comments}, {pull.Commits}, {pull.ChangedFiles}, {pull.Additions}, {pull.Deletions}, {pull.Draft}, {pull.Merged}, '{pull.State.StringValue}', {requestedReviewers}, '{labeljson}', '{pull.Url}', '{pull.Base.Repository.Owner.Login}', '{JsonConvert.SerializeObject(checksList)}', {checks_complete_count}, {checks_incomplete_count}, {checks_success_count}, {checks_fail_count}, {assignedReviewers}, '{installationReviewsJson}', {priority}), ";

                                    var comments = await installationClient.Issue.Comment.GetAllForIssue(repository.id, repoPull.Number);
                                    foreach (var comm in comments)
                                    {
                                        comm_query += $" ({comm.Id}, '{repository.name}', {pull.Number}, {false}),";
                                    }

                                    var reviewheads = await installationClient.PullRequest.Review.GetAll(owner, repoName, pull.Number);
                                    foreach (var review in reviewheads)
                                    {
                                        var published_comments = await installationClient.PullRequest.Review.GetAllComments(owner, repoName, pull.Number, review.Id);
                                        var comment_id_list = string.Join(",", published_comments.Select(c => c.Id));

                                        review_head_query += $" ({review.Id}, '{repoName}', {pull.Number}, '{review.Body.Replace("'", "''")}', '{review.State.StringValue}', ARRAY[{comment_id_list}]::bigint[]),";

                                        foreach (var revcomm in published_comments)
                                        {
                                            comm_query += $" ({revcomm.Id}, '{repository.name}', {pull.Number}, {true}),";
                                        }

                                    }
                                }

                                query = query.Substring(0, query.Length - 2);
                                using (var command = new NpgsqlCommand(query, connection))
                                {
                                    command.ExecuteNonQuery();
                                }

                                comm_query = comm_query[..^1];
                                using (var command = new NpgsqlCommand(comm_query, connection))
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
                            string query3 = $"DELETE FROM comments WHERE reponame = '{repository.name}'";
                            string query4 = $"DELETE FROM reviewhead WHERE reponame = '{repository.name}'";

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

                            using (NpgsqlCommand command = new NpgsqlCommand(query3, connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            using (NpgsqlCommand command = new NpgsqlCommand(query4, connection))
                            {
                                command.ExecuteNonQuery();
                            }

                            connection.Close();

                            Console.WriteLine($"Repository {repository.full_name} is removed from database.");
                        }
                    }

                    break;
                case "pull_request": // DONE
                    var pullRequestPayload = JsonConvert.DeserializeObject<PullRequestPayload>(requestBody);
                    if (pullRequestPayload.action == "assigned" || pullRequestPayload.action == "unassigned")
                    {
                        var requestedReviewers = pullRequestPayload.pull_request.assignees.Any()
                            ? $"'{{ {string.Join(",", pullRequestPayload.pull_request.assignees.Select(r => $@"""{r.login}"""))} }}'"
                            : "'{}'";

                        var query = $"UPDATE pullrequestinfo SET assignees = {requestedReviewers}, updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestPayload.pull_request.id}";
                        connection.Open();

                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("Assignee " + pullRequestPayload.action);
                    }
                    else if (pullRequestPayload.action == "opened")
                    {
                        connection.Open();
                        int priority = 0;

                        string parameters = "(repoid, pullid, reponame, pullnumber, title, author, authoravatarurl, createdat, updatedat, comments, commits, changedfiles, additions, deletions, draft, merged, state, reviewers, labels, pullurl, repoowner, checks, checks_complete, checks_incomplete, checks_success, checks_fail, assignees, reviews, priority)";

                        string query = "INSERT INTO pullrequestinfo " + parameters + " VALUES ";

                        var requestedReviewers = pullRequestPayload.pull_request.requested_reviewers.Any()
                        ? $"'{{ {string.Join(",", pullRequestPayload.pull_request.requested_reviewers.Select(r => $@"""{r.login}"""))} }}'"
                        : "'{}'";

                        var labels = new List<object>();
                        foreach (var label in pullRequestPayload.pull_request.labels)
                        {
                            labels.Add(new
                            {
                                id = label.id,
                                name = label.name,
                                color = label.color
                            });

                            // Set priority based on label name
                            switch (label.name)
                            {
                                case "Priority: Critical":
                                    priority = 4;
                                    break;
                                case "Priority: High":
                                    priority = 3;
                                    break;
                                case "Priority: Medium":
                                    priority = 2;
                                    break;
                                case "Priority: Low":
                                    priority = 1;
                                    break;
                                default:
                                    // Do nothing
                                    break;
                            }
                        }

                        var labeljson = JsonConvert.SerializeObject(labels);
                        var pull = pullRequestPayload.pull_request;
                        string createdAtFormatted = FormatDateString(pullRequestPayload.pull_request.created_at);
                        string updatedAtFormatted = FormatDateString(pullRequestPayload.pull_request.updated_at);

                        var checksList = new List<object>();
                        int checks_complete_count = 0;
                        int checks_incomplete_count = 0;
                        int checks_success_count = 0;
                        int checks_fail_count = 0;

                        var assignedReviewers = pullRequestPayload.pull_request.assignees.Any()
                            ? $"'{{ {string.Join(",", pullRequestPayload.pull_request.assignees.Select(r => $@"""{r.login}"""))} }}'"
                            : "'{}'";

                        var installationLatestReviews = new List<object>();
                        var installationReviewsJson = JsonConvert.SerializeObject(installationLatestReviews);


                        query += $"({pullRequestPayload.repository.id}, {pullRequestPayload.pull_request.id}, '{pullRequestPayload.pull_request.@base.repo.name}', {pull.number}, '{pull.title}', '{pull.user.login}', '{pull.user.avatar_url}', '{createdAtFormatted}', '{updatedAtFormatted}', {pull.comments}, {pull.commits}, {pull.changed_files}, {pull.additions}, {pull.deletions}, {pull.draft}, {pull.merged}, '{pull.state}', {requestedReviewers}, '{labeljson}', '{pull.url}', '{pull.@base.repo.owner.login}', '{JsonConvert.SerializeObject(checksList)}', {checks_complete_count}, {checks_incomplete_count}, {checks_success_count}, {checks_fail_count}, {assignedReviewers}, '{installationReviewsJson}', {priority})";

                        using (var command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("pr eklendi");
                    }
                    else if (pullRequestPayload.action == "closed" || pullRequestPayload.action == "reopened")
                    {
                        var query = $"UPDATE pullrequestinfo SET state = '{pullRequestPayload.pull_request.state.ToString()}', updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestPayload.pull_request.id}";
                        connection.Open();

                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("pull " + pullRequestPayload.action);
                    }
                    else if (pullRequestPayload.action == "edited")
                    {
                        var query = $"UPDATE pullrequestinfo SET title = '{pullRequestPayload.pull_request.title}', updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestPayload.pull_request.id}";
                        connection.Open();

                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("Edited");
                    }
                    else if (pullRequestPayload.action == "labeled" || pullRequestPayload.action == "unlabeled")
                    {
                        var labels = new List<object>();
                        int priority = 0; // Default priority

                        foreach (var label in pullRequestPayload.pull_request.labels)
                        {
                            labels.Add(new
                            {
                                id = label.id,
                                name = label.name,
                                color = label.color
                            });

                            // Set priority based on label name
                            switch (label.name)
                            {
                                case "Priority: Critical":
                                    priority = 4;
                                    break;
                                case "Priority: High":
                                    priority = 3;
                                    break;
                                case "Priority: Medium":
                                    priority = 2;
                                    break;
                                case "Priority: Low":
                                    priority = 1;
                                    break;
                                default:
                                    // Do nothing
                                    break;
                            }
                        }
                        var labeljson = JsonConvert.SerializeObject(labels);

                        var query = $"UPDATE pullrequestinfo SET labels = '{labeljson}', priority = {priority}, updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestPayload.pull_request.id}";
                        connection.Open();

                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("labels updated");
                    }
                    else if (pullRequestPayload.action == "review_request_removed" || pullRequestPayload.action == "review_requested")
                    {
                        var requestedReviewers = pullRequestPayload.pull_request.requested_reviewers.Any()
                            ? $"'{{ {string.Join(",", pullRequestPayload.pull_request.requested_reviewers.Select(r => $@"""{r.login}"""))} }}'"
                            : "'{}'";

                        var query = $"UPDATE pullrequestinfo SET reviewers = {requestedReviewers}, updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestPayload.pull_request.id}";
                        connection.Open();

                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("Review Request Update");
                    }
                    break;
                case "pull_request_review": // DONE
                    var pullRequestReviewPayload = JsonConvert.DeserializeObject<PullRequestReviewPayload>(requestBody);
                    //Console.WriteLine(pullRequestReviewPayload.review.state);
                    //Console.WriteLine(pullRequestReviewPayload.review.user.login);

                    Console.WriteLine("PR review " + pullRequestReviewPayload.action);

                    response = await _client.GitHubApps.CreateInstallationToken(pullRequestReviewPayload.installation.id);
                    installationClient = GetNewClient(response.Token);

                    // Get all reviews for the pull request
                    var reviews = await installationClient.PullRequest.Review.GetAll(
                        pullRequestReviewPayload.repository.owner.login,
                        pullRequestReviewPayload.repository.name,
                        pullRequestReviewPayload.pull_request.number);

                    var latestReviewsByUser = reviews
                        .GroupBy(r => r.User.Login)
                        .Select(g => g.OrderByDescending(r => r.SubmittedAt).First())
                        .ToList();

                    var latestReviews = new List<object>();
                    foreach (var review in latestReviewsByUser)
                    {
                        //Console.WriteLine($"Latest Review State: {review.State}, User: {review.User.Login}");

                        latestReviews.Add(
                            new
                            {
                                login = review.User.Login,
                                state = review.State.ToString()
                            }
                        );
                    }

                    var reviewsJson = JsonConvert.SerializeObject(latestReviews);

                    // Get requested reviewers

                    var reqRevs = pullRequestReviewPayload.pull_request.requested_reviewers.Any()
                            ? $"'{{ {string.Join(",", pullRequestReviewPayload.pull_request.requested_reviewers.Select(r => $@"""{r.login}"""))} }}'"
                            : "'{}'";

                    // Update requested reviewers and reviews in the database
                    string reviewsQuery = $"UPDATE pullrequestinfo SET reviewers = {reqRevs}, reviews = '{reviewsJson}', updatedat = '{DateTime.Today:yyyy-MM-dd}' WHERE pullid = {pullRequestReviewPayload.pull_request.id}";
                    connection.Open();
                    using (var command = new NpgsqlCommand(reviewsQuery, connection))
                    {
                        command.ExecuteNonQuery();
                    }
                    connection.Close();
                    Console.WriteLine("PR Reviews Updated");
                    break;
                case "pull_request_review_thread": // resolved unresolved olayı. Gösterceksek faydalı yoksa gerek yok
                    var pullRequestReviewThreadPayload = JsonConvert.DeserializeObject<PullRequestReviewThreadPayload>(requestBody);
                    if (pullRequestReviewThreadPayload.action == "resolved")
                    {
                        Console.WriteLine($"PR review thread {pullRequestReviewThreadPayload.thread.node_id} resolved");
                    }
                    else if (pullRequestReviewThreadPayload.action == "unresolved")
                    {
                        Console.WriteLine($"PR review thread {pullRequestReviewThreadPayload.thread.node_id} unresolved");
                    }
                    break;
                case "pull_request_review_comment":
                    var pullRequestReviewCommentPayload = JsonConvert.DeserializeObject<PullRequestReviewCommentPayload>(requestBody);
                    if (pullRequestReviewCommentPayload.action == "created")
                    {
                        var comment = pullRequestReviewCommentPayload.comment;
                        List<long> comment_ids = [];
                        int row_exists = 0;
                        
                        string query = $"INSERT INTO comments (commentid, reponame, prnumber, is_review) VALUES ({comment.id}, '{pullRequestReviewCommentPayload.repository.name}', {pullRequestReviewCommentPayload.pull_request.number}, {true})";
                        connection.Open();

                        using (var command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }


                        string sel_query = $"SELECT COUNT(*) FROM reviewhead WHERE review_id = {comment.pull_request_review_id}";


                        using (var command = new NpgsqlCommand(sel_query, connection))
                        {
                            using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                            {
                                while (await reader.ReadAsync())
                                {
                                    row_exists = reader.GetInt16(0);
                                }
                            }
                        }

                        if ( row_exists == 0  )
                        {
                            Console.WriteLine("in if");
                            comment_ids.Add(comment.id);
                            string new_query = $"INSERT INTO reviewhead (review_id, reponame, prnumber, comments) VALUES ({comment.pull_request_review_id}, '{pullRequestReviewCommentPayload.repository.name}', {pullRequestReviewCommentPayload.pull_request.number}, @comments)";
                            using (var command = new NpgsqlCommand(new_query, connection))
                            {
                                command.Parameters.AddWithValue("@comments", comment_ids.ToArray());
                                command.ExecuteNonQuery();
                            }
                        }
                        else
                        {
                            Console.WriteLine("in else");
                            string new_query = $"SELECT comments FROM reviewhead WHERE review_id = {comment.pull_request_review_id}";
                            using (var command = new NpgsqlCommand(new_query, connection))
                            {
                                using (NpgsqlDataReader reader = await command.ExecuteReaderAsync())
                                {
                                    while (await reader.ReadAsync())
                                    {
                                        comment_ids = reader.GetFieldValue<List<long>>(0);
                                    }
                                }
                            }

                            comment_ids.Add(comment.id);

                            string update = $"UPDATE reviewhead SET comments = @commentIds WHERE review_id = {comment.pull_request_review_id}";
                            using (var command = new NpgsqlCommand(update, connection))
                            {
                                command.Parameters.AddWithValue("@commentIds", comment_ids.ToArray());
                                command.ExecuteNonQuery();
                            }

                        }

                        connection.Close();

                        Console.WriteLine($"PR review comment {pullRequestReviewCommentPayload.comment.id} created\n {pullRequestReviewCommentPayload.comment.pull_request_review_id}");
                    }
                    else if (pullRequestReviewCommentPayload.action == "deleted")
                    {
                        
                        Console.WriteLine($"PR review comment {pullRequestReviewCommentPayload.comment.id} deleted\n {pullRequestReviewCommentPayload.comment.pull_request_review_id}");
                    }
                    break;
                case "issue_comment":
                    var issueCommentPayload = JsonConvert.DeserializeObject<Core.Entities.Payloads.IssueCommentPayload>(requestBody);
                    if(issueCommentPayload.action == "created")
                    {
                        string query = $"INSERT INTO comments (commentid, reponame, prnumber, is_review) VALUES ({issueCommentPayload.comment.id}, '{issueCommentPayload.repository.name}', {issueCommentPayload.issue.number}, {false})";
                        connection.Open();
                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();

                        Console.WriteLine("issue comment created");
                    }
                    else if ( issueCommentPayload.action == "deleted" )
                    {
                        string query = $"DELETE FROM comments WHERE commentid = {issueCommentPayload.comment.id}";
                        connection.Open();
                        using (NpgsqlCommand command = new NpgsqlCommand(query, connection))
                        {
                            command.ExecuteNonQuery();
                        }
                        connection.Close();
                        Console.WriteLine("issue comment deleted");
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
            var options = new PullRequestRequest
            {
                State = ItemStateFilter.All
            };
            // Get the repository by ID
            var pulls = await installationClient.PullRequest.GetAllForRepository(id, options);
            return pulls;
        }

        public async Task<PullRequest?> GetPullById(long repoid, int prnum, GitHubClient installationClient) // Change the method signature to accept ID
        {
            // Get the repository by ID
            var pull = await installationClient.PullRequest.Get(repoid, prnum);

            return pull;
        }

        static string FormatDateString(string dateString)
        {
            if (DateTime.TryParse(dateString, out DateTime date))
            {
                return date.ToString("yyyy-MM-dd");
            }
            else
            {
                // Handle invalid date string
                return string.Empty; // or throw an exception, log an error, etc.
            }
        }
    }
}
