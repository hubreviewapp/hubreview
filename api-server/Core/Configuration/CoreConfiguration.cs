namespace CS.Core.Configuration;

public class CoreConfiguration
{
    public int AppId { get; set; }
    public string AppClientId { get; set; } = String.Empty;
    public string AppClientSecret { get; set; } = String.Empty;
    public string OAuthClientId { get; set; } = String.Empty;
    public string OAuthClientSecret { get; set; } = String.Empty;
    public string DbConnectionString { get; set; } = String.Empty;
}

