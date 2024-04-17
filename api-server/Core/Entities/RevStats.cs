namespace CS.Core.Entities
{
    public class ReviewStats
    {
        public string FirstDay { get; set; }
        public string LastDay { get; set; }
        public int ApprovedCount { get; set; }
        public int CommentedCount { get; set; }
        public int ChangesReqCount { get; set; }
        public int PendingCount { get; set; }
    }
}