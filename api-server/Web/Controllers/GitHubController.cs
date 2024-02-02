using System.Web;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubController : ControllerBase
{
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

            HttpContext.Session.SetString("AccessToken", access_token);
            //var accessToken = HttpContext.Session.GetString("AccessToken");

            return Redirect($"http://localhost:5173");
        }
    }


    [HttpGet("repos")]
    public async Task<ActionResult> getRepository()
    {
        var access_token = HttpContext.Session.GetString("AccessToken");
        Console.WriteLine(access_token);

        //Console.WriteLine("session: " + sessionnn);
        var client1 = new GitHubClient(new ProductHeaderValue("HubReview"));
        var tokenAuth = new Credentials(access_token);
        client1.Credentials = tokenAuth;
        var user = await client1.User.Current();
        var repos = await client1.Repository.GetAllForUser(user.Login);
        foreach (var repo in repos)
        {
            Console.WriteLine(repo.Name);
        }

        return Redirect($"http://localhost:5173");
    }
}
