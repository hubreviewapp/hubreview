namespace CS.Core.Entities
{
  public class PullRequestReviewCommentPayload
  {
    public string? action { get; set; }
    public CommentInfo? comment { get; set; }
    public InstallationInfo? installation { get; set; }
    public OrganizationInfo? organization { get; set; }
    public PullRequestInfo? pull_request { get; set; }
    public RepositoryInfo? repository { get; set; }
    public SenderInfo? sender { get; set; }
  }
}
