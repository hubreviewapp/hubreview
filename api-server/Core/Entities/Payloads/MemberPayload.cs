namespace CS.Core.Entities.Payloads
{
  public class MemberPayload
  {
    public string? action { get; set; }
    public ChangesInfo? changes { get; set; }
    public InstallationInfo? installation { get; set; }
    public UserInfo? member { get; set; }
    public OrganizationInfo? organization { get; set; }
    public RepositoryInfo? repository { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
