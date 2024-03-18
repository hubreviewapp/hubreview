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
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? RepoName { get; set; }
        public int Additions { get; set; }
        public int Deletions { get; set; }
        public int Files { get; set; }
        public int Comments { get; set; }
        public Array? Labels { get; set; }
        public string? RepoOwner { get; set; }
        public Array? Checks { get; set; }
        public int ChecksComplete { get; set; }
        public int ChecksIncomplete { get; set; }
        public int ChecksSuccess { get; set; }
        public int ChecksFail { get; set; }
        public string[]? Reviewers { get; set; }
        public Array? Reviews { get; set; }
        public string[]? Assignees { get; set; }
    }
}
