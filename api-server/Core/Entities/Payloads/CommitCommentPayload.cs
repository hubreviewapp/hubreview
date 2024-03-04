namespace CS.Core.Entities.Payloads
{
    public class CommitCommentPayload
    {
        public string? action { get; set; }
        public CommentInfo? comment { get; set; }
        public InstallationInfo? installation { get; set; }
        public OrganizationInfo? organization { get; set; }
        public RepositoryInfo? repository { get; set; }
        public SenderInfo? sender { get; set; }
    }
}
