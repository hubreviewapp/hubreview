namespace CS.Core.Entities
{
        public class DeploymentInfo
        {
            public string? url { get; set; }
            public int id { get; set; }
            public string? node_id { get; set; }
            public string? task { get; set; }
            public string? original_environment { get; set; }
            public string? environment { get; set; }
            public string? description { get; set; }
            public string? created_at { get; set; }
            public string? updated_at { get; set; }
            public string? statuses_url { get; set; }
            public string? repository_url { get; set; }
            public bool transient_environment { get; set; }
            public bool production_environment { get; set; }
            public AppInfo? performed_via_github_app { get; set; }
        }
}