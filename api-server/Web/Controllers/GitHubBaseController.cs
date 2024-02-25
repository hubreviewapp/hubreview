using DotEnv.Core;
using GitHubJwt;
using Microsoft.AspNetCore.Mvc;
using Octokit;

namespace CS.Web.Controllers;

public class GithubBaseController : ControllerBase
{
    protected readonly IHttpContextAccessor _httpContextAccessor;
    protected readonly IEnvReader _reader;
    [ActivatorUtilitiesConstructor]
    public GithubBaseController(IHttpContextAccessor httpContextAccessor, IEnvReader reader)
    {
        _httpContextAccessor = httpContextAccessor;
        _reader = reader;
    }

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

    protected GitHubClient GetNewClient(string? token = null)
    {
        GitHubClient res;

        if (token == null)
        {
            GitHubJwtFactory generator = _getGitHubJwtGenerator();
            string jwtToken = generator.CreateEncodedJwtToken();
            res = _getGitHubClient(jwtToken);

        }
        else
        {
            res = _getGitHubClient(token);
        }
        return res;
    }
}
