namespace CS.Core.Configuration;

public class CoreConfiguration
{
    public int AppId { get; set; }
    public string ClientId { get; set; } = String.Empty;
    public string ClientSecret { get; set; } = String.Empty;
    public string DbConnectionString { get; set; } = String.Empty;
}

