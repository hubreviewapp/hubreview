namespace CS.Core.Entities
{
    public class PATRequestInfo
    {
        public required long id { get; set; }
        public string? owner { get; set; }
        public required PermissionAddedInfo permission_added { get; set; }
        public required PermissionUpgradedInfo permission_upgraded { get; set; }
        public required PermissionsResultInfo permission_result { get; set; }
        public required string repository_selection { get; set; }
        public int? repository_count { get; set; }
        public RepositoryInfo[]? repositories { get; set; }
        public required string created_at { get; set; }
        public bool token_expired { get; set; }
        public string? token_expired_at { get; set; }
        public string? token_last_used_at { get; set; }

    }
}
