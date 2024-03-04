namespace CS.Core.Entities
{
    public class AutoMergeInfo
    {
        public string? commit_message { get; set; }
        public string? commit_title { get; set; }
        public EnabledByInfo? enabled_by { get; set; }
        public string? merge_method { get; set; }
    }
}
