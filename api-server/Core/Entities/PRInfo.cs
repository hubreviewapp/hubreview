using System.Dynamic;

namespace CS.Core.Entities
{
    public class PRInfo
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public long PRNumber { get; set; }
        public string? Author { get; set; }
        public string? AuthorAvatarURL { get; set; }
        public DateOnly? CreatedAt { get; set; }
        public DateOnly? UpdatedAt { get; set; }
        public string? RepoName { get; set; }
        public int Additions { get; set; }
        public int Deletions { get; set; }
        public int Files { get; set; }
        public int Comments { get; set; }
        public Array? Labels { get; set; }
        public string? RepoOwner { get; set; }
    }
}
