namespace CS.Core.Entities
{
    public class PermissionAddedInfo
    {
        public required OrganizationInfo organization { get; set; }
        public required RepositoryInfo repository { get; set; }
        public required object other { get; set; }
    }
}
