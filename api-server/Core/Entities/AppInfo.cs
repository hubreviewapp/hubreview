namespace CS.Core.Entities
{
    public class AppInfo
    {
        public int id { get; set; }
        public string? slug { get; set; }
        public string? node_id { get; set; }
        public UserInfo? owner { get; set; }
        public string? name { get; set; }
        public string? description { get; set; }
        public string? external_url { get; set; }
        public string? html_url { get; set; }
        public string? created_at { get; set; }
        public string? updated_at { get; set; }
        public PermissionsInfo? permissions { get; set; }
        public string[]? events { get; set; }
        public int installations_count { get; set; }
        public string? client_id { get; set; }
        public string? client_secret { get; set; }
        public string? webhook_secret { get; set; }
        public string? pem { get; set; }
    }
}
