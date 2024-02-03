using System.Web;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubController : ControllerBase
{

    private readonly IHttpContextAccessor _httpContextAccessor;

    [ActivatorUtilitiesConstructor]
    public GitHubController(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    [HttpGet("acquireToken")]
    public async Task<ActionResult> acquireToken(string code)
    {

        var clientId = "64318456282bb1488063";
        var clientSecret = "51388c5053ea503fc8141b0184b05b5ae5529b81";
        var redirectUri = "http://localhost:5018/api/github/acquireToken";

        using (var httpClient = new HttpClient())
        {
            var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"client_id", clientId},
                {"client_secret", clientSecret},
                {"code", code},
                {"redirect_uri", redirectUri},
            });

            var tokenResponse = await httpClient.PostAsync("https://github.com/login/oauth/access_token", tokenRequest);
            var responseContent = await tokenResponse.Content.ReadAsStringAsync();
            Console.WriteLine(responseContent);

            // Parse the response to get the access token
            var parsedResponse = HttpUtility.ParseQueryString(responseContent);
            var access_token = parsedResponse["access_token"];
            Console.WriteLine(access_token);

            _httpContextAccessor?.HttpContext?.Session.SetString("AccessToken", access_token);

            var client = new GitHubClient(new ProductHeaderValue("HubReviewApp"))
            {
                Credentials = new Credentials(access_token)
            };
            var user = await client.User.Current();
            _httpContextAccessor?.HttpContext?.Session.SetString("UserLogin", user.Login);

            return Redirect($"http://localhost:5173");
        }
    }    
    
    [HttpGet("getRepository")]
    public async Task<ActionResult> getRepository()
    {
        var generator = new GitHubJwt.GitHubJwtFactory(
            new GitHubJwt.FilePrivateKeySource("../../api-server/hubreviewapp.2024-02-02.private-key.pem"),
            new GitHubJwt.GitHubJwtFactoryOptions
            {
                AppIntegrationId = 812902, // The GitHub App Id
                ExpirationSeconds = 300 // 10 minutes is the maximum time allowed
            }
        );

        var jwtToken = generator.CreateEncodedJwtToken();

        var appClient = new GitHubClient(new ProductHeaderValue("HubReviewApp"))
        {
            Credentials = new Credentials(jwtToken, AuthenticationType.Bearer)
        };

        var userLogin = _httpContextAccessor?.HttpContext?.Session.GetString("UserLogin");

        var installations = await appClient.GitHubApps.GetAllInstallationsForCurrent();
        foreach( var installation in installations)
        {
            if( installation.Account.Login == userLogin )
            {
                var response = await appClient.GitHubApps.CreateInstallationToken(installation.Id);
                var installationClient = new GitHubClient(new ProductHeaderValue("HubReviewApp"))
                {
                    Credentials = new Credentials(response.Token)
                };

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
}
