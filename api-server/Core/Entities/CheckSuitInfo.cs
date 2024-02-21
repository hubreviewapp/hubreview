namespace CS.Core.Entities
{
    public class CheckSuitInfo
    {
        public string? after { get; set; }
        public AppInfo? app { get; set; }
        public string? before { get; set; }
        public string? conclusion { get; set; }
        public string? created_at { get; set; }
        public string? head_branch { get; set; }
        public string? head_sha { get; set; }
        public int id { get; set; }
        public string? node_id { get; set; }
        public PullRequestInfo[]? pull_requests { get; set; }
        public RepositoryInfo? repository { get; set; }
        public string? status { get; set; }
        public string? updated_at { get; set; }
        public string? url { get; set; }
    }
}
