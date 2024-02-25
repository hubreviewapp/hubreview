using System.Web;
using DotEnv.Core;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

[Route("api/github")]
[ApiController]

public class GitHubAuthenticationController : GithubBaseController
{
    public GitHubAuthenticationController(IHttpContextAccessor httpContextAccessor, IEnvReader reader) : base(httpContextAccessor, reader)
    {
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

            GitHubClient userClient = GetNewClient(access_token);
            var user = await userClient.User.Current();
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

}
