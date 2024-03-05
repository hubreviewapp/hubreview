namespace CS.Core.Entities
{
    public class InstallationInfo
    {
        public long id { get; set; }
        public string? node_id { get; set; }
        public UserInfo? account { get; set; }
    }
}
