namespace CS.Core.Entities
{
  public class ReviewInfo
  {
    public LinksInfo? _links { get; set; }
    public string? author_association { get; set; }
    public string? body { get; set; }
    public string? commit_id { get; set; }
    public string? html_url { get; set; }
    public int id { get; set; }
    public string? node_id { get; set; }
    public string? pull_request_url { get; set; }
    public string? state { get; set; }
    public string? submitted_at { get; set; }
    public UserInfo? user { get; set; }
  }
}
