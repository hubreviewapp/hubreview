using System.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Octokit;
using DotEnv.Core;
using GitHubJwt;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubController : ControllerBase
{

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IEnvReader _reader;

    private static GitHubClient _getGitHubClient(string token)
    {
        return new GitHubClient(new ProductHeaderValue("HubReviewApp"))
        {
            Credentials = new Credentials(token, AuthenticationType.Bearer)
        };
    }

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
    }

    [ActivatorUtilitiesConstructor]
    public GitHubController(IHttpContextAccessor httpContextAccessor, IEnvReader reader)
    {
        _httpContextAccessor = httpContextAccessor;
        _reader = reader;
    }
    
    [HttpGet("acquireToken")]
    public async Task<ActionResult> acquireToken(string code)
    {
        using (var httpClient = new HttpClient())
        {
            var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"client_id", _reader["CLIENT_ID"]},
                {"client_secret", _reader["CLIENT_SECRET"]},
                {"code", code},
                {"redirect_uri", _reader["ACQUIRE_TOKEN_REDIRECT_URI"]},
            });

            var tokenResponse = await httpClient.PostAsync("https://github.com/login/oauth/access_token", tokenRequest);
            var responseContent = await tokenResponse.Content.ReadAsStringAsync();

            // Parse the response to get the access token
            var parsedResponse = HttpUtility.ParseQueryString(responseContent);
            var access_token = parsedResponse["access_token"];

            _httpContextAccessor?.HttpContext?.Session.SetString("AccessToken", access_token);

            var client = _getGitHubClient(access_token);
            var user = await client.User.Current();
            _httpContextAccessor?.HttpContext?.Session.SetString("UserLogin", user.Login);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserAvatarURL", user.AvatarUrl);
            _httpContextAccessor?.HttpContext?.Session.SetString("UserName", user.Name);

            return Redirect($"http://localhost:5173");
        }
    }

    [HttpGet("getUserInfo")]
    public async Task<ActionResult> getUserInfo()
    {   
        var userInfo = new
        {
            UserName = _httpContextAccessor?.HttpContext?.Session.GetString("UserName"),
            UserLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin"),
            UserAvatarUrl = _httpContextAccessor?.HttpContext?.Session.GetString("UserAvatarURL")
        };

        return Ok(userInfo);
    }

    [HttpGet("logoutUser")]
    public async Task<ActionResult> logoutUser()
    {
        _httpContextAccessor?.HttpContext?.Session.Clear();
        return Ok();
        
    }
    
    [HttpGet("getRepository")]
    public async Task<ActionResult> getRepository()
    {
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach( var installation in installations)
        {
            if( installation.Account.Login == userLogin )
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);
                var reps = await installationClient.GitHubApps.Installation.GetAllRepositoriesForCurrent();

                return Ok(new { RepoNames = reps.Repositories.Select(rep => new { 
                    Id = rep.Id, 
                    Name = rep.Name, 
                    OwnerLogin = rep.Owner.Login, 
                    CreatedAt = rep.CreatedAt.Date.ToString("dd/MM/yyyy") 
                    }).ToArray() });

            }
        }

        return NotFound("There exists no user in session.");
    }

    [HttpGet("getRepository/{id}")] // Update the route to include repository ID
    public async Task<ActionResult> getRepositoryById(int id) // Change the method signature to accept ID
    {
        var generator = _getGitHubJwtGenerator();
        var jwtToken = generator.CreateEncodedJwtToken();
        var appClient = _getGitHubClient(jwtToken);

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach (var installation in installations)
        {
            if (installation.Account.Login == userLogin)
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = _getGitHubClient(response.Token);

                try
                {
                    var pulls = await installationClient.PullRequest.GetAllForRepository(id);
                    foreach (var pull in pulls)
                    {

                        var comments = await installationClient.Issue.Comment.GetAllForIssue(id, pull.Number);
                        var reviews = await installationClient.PullRequest.Review.GetAll(id, pull.Number);
                        Console.WriteLine($"PR Status: {pull.State}");
                        Console.WriteLine($"Comments: {comments.Count}");
                        Console.WriteLine($"Review: {reviews.Count}");
                        foreach (var label in pull.Labels)
                        {
                            Console.WriteLine(label.Name);
                        }

                        foreach (var comm in comments )
                        {
                            Console.WriteLine($"Commenter: {comm.User.Login}");
                            Console.WriteLine($"Comment body: {comm.Body}");
                            Console.WriteLine($"Comment reacts: {comm.Reactions.Hooray}");
                        }

                        foreach (var rev in reviews )
                        {
                            Console.WriteLine($"Reviewer: {rev.User.Login}");
                            Console.WriteLine($"Review State: {rev.State}");
                            Console.WriteLine($"Review body: {rev.Body}");
                        }
                    }
                    return Ok();
                }
                catch (NotFoundException)
                {
                    return NotFound($"Repository with ID {id} not found.");
                }
            }
        }

        return NotFound("There exists no user in session.");
    }

}
