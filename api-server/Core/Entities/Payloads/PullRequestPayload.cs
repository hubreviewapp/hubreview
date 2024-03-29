namespace CS.Core.Entities.Payloads
{
    public class PullRequestPayload
    {
        public string? action { get; set; }
        public UserInfo? assignee { get; set; }
        public InstallationInfo? installation { get; set; }
        public int number { get; set; }
        public OrganizationInfo? organization { get; set; }
        public PullRequestInfo? pull_request { get; set; }
        public RepositoryInfo? repository { get; set; }
        public SenderInfo? sender { get; set; }
    }
}
