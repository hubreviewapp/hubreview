namespace CS.Core.Entities.Payloads
{
    public class TokenRequestPayload
    {
        public string? action { get; set; }
        public InstallationInfo? installation { get; set; }
        public OrganizationInfo? organization { get; set; }
        public PATRequestInfo? personal_access_token_request { get; set; }
        public SenderInfo? sender { get; set; }
    }
}
