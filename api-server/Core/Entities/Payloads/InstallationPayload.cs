namespace CS.Core.Entities.Payloads
{
  public class InstallationPayload
  {
    public string? action { get; set; }
    public InstallationInfo? installation { get; set; }
    public OrganizationInfo? organization { get; set; }
    
    //repositories have 5 instances
    public RepositoryInfo[]? repositories { get; set; }
    public RepositoryInfo? repository { get; set; }
    public UserInfo? requester { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
