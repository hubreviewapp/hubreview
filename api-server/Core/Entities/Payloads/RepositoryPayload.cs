namespace CS.Core.Entities.Payloads
{
  public class RepositoryPayload
  {
    public string? action { get; set; }
    public InstallationInfo? installation { get; set; }
    public OrganizationInfo? organization { get; set; }
    public RepositoryInfo? repository { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
