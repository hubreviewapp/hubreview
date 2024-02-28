namespace CS.Core.Entities
{
    public class IssueCommentInfo
    {
        public long id { get; set; }
        public string? author { get; set; }
        public string? body { get; set; }
        public DateTimeOffset? created_at { get; set; }
        public DateTimeOffset? updated_at { get; set; }
        public string? association { get; set; }

    }
}
