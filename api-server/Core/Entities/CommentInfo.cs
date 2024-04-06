namespace CS.Core.Entities
{
    public class CommentInfo
    {
        public LinksInfo? _links { get; set; }
        public string? author_association { get; set; }
        public string? body { get; set; }
        public string? commit_id { get; set; }
        public string? created_at { get; set; }
        public string? diff_hunk { get; set; }
        public string? html_url { get; set; }
        public long id { get; set; }
        public int in_reply_to_id { get; set; }
        public int? line { get; set; }
        public string? node_id { get; set; }
        public string? original_commit_id { get; set; }
        public int? original_line { get; set; }
        public int original_position { get; set; }
        public int? original_start_line { get; set; }
        public string? path { get; set; }
        public int? position { get; set; }
        public long pull_request_review_id { get; set; }
        public string? pull_request_url { get; set; }
        public string? side { get; set; }
        public int? start_line { get; set; }
        public string? start_side { get; set; }
        public string? subject_type { get; set; }
        public string? updated_at { get; set; }
        public string? url { get; set; }
        public UserInfo? user { get; set; }
    }
}
