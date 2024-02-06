using System.Dynamic;

namespace CS.Core.Entities
{
    public class PRInfo
    {
        public long Id { get; set; }
        public string Title { get; set; }
        public long Number { get; set; }
        public string OpenedBy { get; set; }
        public string OpenedByAvatarURL { get; set; }
        public string UpdatedAt { get; set; }
    }
}