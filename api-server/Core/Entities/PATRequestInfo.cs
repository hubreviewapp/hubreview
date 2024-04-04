namespace CS.Core.Entities
{
    public class PATRequestInfo
    {
        public long id { get; set; }
        public string? owner { get; set; }
        public PermissionAddedInfo permission_added { get; set; }
        public PermissionUpgradedInfo permission_upgraded { get; set; }
        public PermissionsResultInfo permission_result { get; set; }
        public string repository_selection { get; set; }
        public int? repository_count { get; set; }
        public RepositoryInfo[]? repositories { get; set; }
        public string created_at { get; set; }
        public bool token_expired { get; set; }
        public string? token_expired_at { get; set; }
        public string? token_last_used_at { get; set; }

    }
}
