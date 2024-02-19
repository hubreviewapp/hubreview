namespace CS.Core.Entities
{
  public class LinksInfo
  {
    public CommentsInfo comments { get; set; }
    public CommitsInfo commits { get; set; }
    public HtmlInfo html { get; set; }
    public IssueInfo issue { get; set; }
    public ReviewCommentInfo review_comment { get; set; }
    public ReviewCommentsInfo review_comments { get; set; }
    public SelfInfo self { get; set; }
    public StatusesInfo statuses { get; set; }
  }
}
