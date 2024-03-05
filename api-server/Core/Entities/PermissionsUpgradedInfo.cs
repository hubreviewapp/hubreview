namespace CS.Core.Entities
{
    public class PermissionUpgradedInfo
    {
        public OrganizationInfo organization { get; set; }
        public RepositoryInfo repository { get; set; }
        public object other { get; set; }
    }
}
