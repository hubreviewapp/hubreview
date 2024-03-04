namespace CS.Core.Entities.Payloads
{
    public class CheckRunPayload
    {
        public string? action { get; set; }
        public CheckRunInfo? check_run { get; set; }
        public InstallationInfo? installation { get; set; }
        public OrganizationInfo? organization { get; set; }
        public RepositoryInfo? repository { get; set; }
        public SenderInfo? sender { get; set; }
    }
}
