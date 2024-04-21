namespace CS.Core.Entities
{
    public class PermissionUpgradedInfo
    {
        public required OrganizationInfo organization { get; set; }
        public required RepositoryInfo repository { get; set; }
        public required object other { get; set; }
    }
}
