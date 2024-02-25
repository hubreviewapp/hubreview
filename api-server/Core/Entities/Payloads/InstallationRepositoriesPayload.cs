namespace CS.Core.Entities.Payloads
{
  public class InstallationRepositoriesPayload
  {
    public string? action { get; set; }
    //repositories have 5 instances
    public RepositoryInfo[]? repositories_added { get; set; }
    //repositories have 5 instances
    public RepositoryInfo[]? repositories_removed { get; set; }
    public string? repository_selection { get; set; }
  }
}
