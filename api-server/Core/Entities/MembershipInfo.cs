namespace CS.Core.Entities
{
    public class MembershipInfo
    {
        public string? organization_url { get; set; }
        public string? role { get; set; }
        public string? state { get; set; }
        public string? url { get; set; }
        public UserInfo? user { get; set; }
    }
}
