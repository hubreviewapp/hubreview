namespace CS.Core.Entities
{
    public class OrganizationInfo
    {
        public string? login { get; set; }
        public long id { get; set; }
        public string? node_id { get; set; }
        public string? url { get; set; }
        public string? repos_url { get; set; }
        public string? events_url { get; set; }
        public string? hooks_url { get; set; }
        public string? issues_url { get; set; }
        public string? members_url { get; set; }
        public string? public_members_url { get; set; }
        public string? avatar_url { get; set; }
        public string? description { get; set; }
    }
}
