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
            Console.WriteLine($"Access token from session in acquireToken: {_httpContextAccessor?.HttpContext?.Session.GetString("AccessToken")}");
            Console.WriteLine($"Session ID in acquireToken: {_httpContextAccessor?.HttpContext?.Session.Id}");

            return Redirect($"http://localhost:5173");
        }
    }


    [HttpGet("getRepository")]
    public async Task<ActionResult> getRepository()
    {
        var access_token = _httpContextAccessor?.HttpContext?.Session.GetString("AccessToken");
        Console.WriteLine($"Session ID in getRepository: {_httpContextAccessor?.HttpContext?.Session.Id}");
        if (string.IsNullOrEmpty(access_token))
        {
            Console.WriteLine("Access token not available.");
            return BadRequest("Access token not available.");
        }

        Console.WriteLine($"Access token: {access_token}");

        var client = new GitHubClient(new ProductHeaderValue("HubReview"))
        {
            Credentials = new Credentials(access_token)
        };

        var user = await client.User.Current();
        var repos = await client.Repository.GetAllForUser(user.Login);

        string[] repoNames = repos.Select(repo => repo.Name).ToArray();

        return Ok(new { RepoNames = repoNames });
    }
}
