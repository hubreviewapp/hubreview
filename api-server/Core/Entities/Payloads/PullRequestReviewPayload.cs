namespace CS.Core.Entities.Payloads
{
  public class PullRequestReviewPayload
  {
    public string? action { get; set; }
    public ReviewCommentInfo? review { get; set; }
    public InstallationInfo? installation { get; set; }
    public OrganizationInfo? organization { get; set; }
    public PullRequestInfo? pull_request { get; set; }
    public RepositoryInfo? repository { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
