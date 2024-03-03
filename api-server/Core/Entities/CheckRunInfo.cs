namespace CS.Core.Entities
{
  public class CheckRunInfo
  {
    public AppInfo? app { get; set; }
    public CheckSuitInfo? check_suite { get; set; }
    public string? completed_at { get; set; }
    public string? conclusion { get; set; }
    public DeploymentInfo? deployment { get; set; }
    public string? details_url { get; set; }
    public string? external_id { get; set; }
    public string? head_sha { get; set; }
    public string? html_url { get; set; }
    public long id { get; set; }
    public string? name { get; set; }
    public string? node_id { get; set; }
    public OutputInfo? output { get; set; }
    // Contains some instances of PullRequestInfo class
    public PullRequestInfo[]? pull_requests { get; set; }
    public string? started_at { get; set; }
    public string? status { get; set; }
    public string? url { get; set; }
  }
}
