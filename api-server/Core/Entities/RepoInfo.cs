namespace CS.Core.Entities
{
    public class RepoInfo
    {
        public long Id { get; set; }
        public string? Name { get; set; }
        public string? OwnerLogin { get; set; }
        public DateOnly? CreatedAt { get; set; }
        public bool IsAdmin { get; set; }
    }
}
