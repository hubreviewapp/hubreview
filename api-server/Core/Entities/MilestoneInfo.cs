namespace CS.Core.Entities
{
    public class MilestoneInfo
    {
        public string? closed_at { get; set; }
        public long closed_issues { get; set; }
        public string? created_at { get; set; }
        public CreatorInfo? creator { get; set; }
        public string? description { get; set; }
        public string? due_on { get; set; }
        public string? html_url { get; set; }
        public long id { get; set; }
        public string? labels_url { get; set; }
        public string? node_id { get; set; }
        public long number { get; set; }
        public long open_issues { get; set; }
        public string? state { get; set; }
        public string? title { get; set; }
        public string? updated_at { get; set; }
        public string? url { get; set; }
    }
}
