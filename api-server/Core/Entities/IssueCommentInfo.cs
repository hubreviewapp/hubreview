namespace CS.Core.Entities
{
    public class IssueCommentInfo
    {
        public long id { get; set; }
        public string? author { get; set; }
        public string? body { get; set; }
        public DateTimeOffset? createdAt { get; set; }
        public DateTimeOffset? updatedAt { get; set; }
        public string? association { get; set; }

    }
}
