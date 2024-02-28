namespace CS.Core.Entities
{
    public class TeamInfo
    {
        public bool deleted { get; set; }
        public string? description { get; set; }
        public string? html_url { get; set; }
        public long id { get; set; }
        public string? members_url { get; set; }
        public string? name { get; set; }
        public string? node_id { get; set; }
        public ParentInfo? parent { get; set; }
        public string? permission { get; set; }
        public string? privacy { get; set; }
        public string? repositories_url { get; set; }
        public string? slug { get; set; }
        public string? url { get; set; }
    }
}
