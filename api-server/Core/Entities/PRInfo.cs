using System.Dynamic;

namespace CS.Core.Entities
{
    public class PRInfo
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public long PRNumber { get; set; }
        public string OpenedBy { get; set; }
        public string OpenedByAvatarURL { get; set; }
        public string UpdatedAt { get; set; }
        public string RepoName { get; set; }
        public int Additions { get; set; }
        public int Deletions { get; set; }
        public int Files { get; set; }
        public int Comments { get; set; }
    }
}