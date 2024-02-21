namespace CS.Core.Entities.Payloads
{
  public class CreatePayload
  {
    public string? description { get; set; }
    public InstallationInfo? installation { get; set; }
    public string? master_branch { get; set; }
    public OrganizationInfo? organization { get; set; }
    public string? pusher_type { get; set; }
    public string? @ref { get; set; }
    public string? ref_type { get; set; }
    public RepositoryInfo? repository { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
