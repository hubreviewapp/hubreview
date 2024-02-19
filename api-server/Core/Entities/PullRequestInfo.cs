namespace CS.Core.Entities
{
  public class PullRequestInfo
  {
    public LinksInfo? _links { get; set; }
    public string? active_lock_reason { get; set; }
    public int additions { get; set; }
    public UserInfo? assignee { get; set; }
    public UserInfo[]? assignees { get; set; }
    public string? author_association { get; set; }
    public AutoMergeInfo? auto_merge { get; set; }   
    public BaseInfo? @base { get; set; }
    public string? body { get; set; }
    public int changed_files { get; set; }
    public string? closed_at { get; set; }
    public int comments { get; set; }
    public string? comments_url { get; set; }
    public int commits { get; set; }
    public string? commits_url { get; set; }
    public string? created_at { get; set; }
    public int deletions { get; set; }
    public string? diff_url { get; set; }
    public bool draft { get; set; }
    public BaseInfo? head { get; set; }
    public string? html_url { get; set; }
    public int id { get; set; }
    public LabelInfo[]? labels { get; set; }
    public bool locked { get; set; }
    public bool maintainer_can_modify { get; set; }
    public string? merge_commit_sha { get; set; }
    public bool? mergeable { get; set; }
    public string? mergeable_state { get; set; }
    public bool merged { get; set; }
    public string? merged_at { get; set; }
    public UserInfo? merged_by { get; set; }
    public MilestoneInfo? milestone { get; set; }
    public string? node_id { get; set; }
    public int number { get; set; }
    public string? patch_url { get; set; }
    public bool? rebaseable { get; set; }
    public UserInfo[]? requested_reviewers { get; set; }
    public TeamInfo[]? requested_teams { get; set; }
    public string? review_comment_url { get; set; }
    public int review_comments { get; set; }
    public string? review_comments_url { get; set; }
    public string? state { get; set; }
    public string? statuses_url { get; set; }
    public string? title { get; set; }
    public string? updated_at { get; set; }
    public string? url { get; set; }
    public UserInfo? user { get; set; }
  }
}
