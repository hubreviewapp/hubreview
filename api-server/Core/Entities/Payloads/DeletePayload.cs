namespace CS.Core.Entities.Payloads
{
    public class DeletePayload
    {
        public InstallationInfo? installation { get; set; }
        public OrganizationInfo? organization { get; set; }
        public string? pusher_type { get; set; }
        public string? @ref { get; set; }
        public string? ref_type { get; set; }
        public RepositoryInfo? repository { get; set; }
        public SenderInfo? sender { get; set; }
    }
}
