namespace CS.Core.Entities
{
    public class IssueInfo
    {
        public string? active_lock_reason { get; set; }
        public AssigneeInfo? assignee { get; set; }
        public AssigneeInfo[]? assignees { get; set; }
        public string? author_association { get; set; }
        public string? body { get; set; }
        public string? closed_at { get; set; }
        public int comments { get; set; }
        public string? comments_url { get; set; }
        public string? created_at { get; set; }
        public bool draft { get; set; }
        public string? events_url { get; set; }
        public string? html_url { get; set; }
        public long id { get; set; }
        public LabelInfo[]? labels { get; set; }
        public string? labels_url { get; set; }
        public bool locked { get; set; }
        public MilestoneInfo? milestone { get; set; }
        public string? node_id { get; set; }
        public int number { get; set; }
        public object? performed_via_github_app { get; set; }
        public PullRequestInfo? pull_request { get; set; }
        public object? reactions { get; set; }
        public string? repository_url { get; set; }
        public string? state { get; set; }
        public string? state_reason { get; set; }
        public string? timeline_url { get; set; }
        public string? title { get; set; }
        public string? updated_at { get; set; }
        public string? url { get; set; }
        public UserInfo? user { get; set; }
    }
}
