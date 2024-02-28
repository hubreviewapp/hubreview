namespace CS.Core.Entities
{
    public class PermissionsInfo
    {
        public bool admin { get; set; }
        public bool maintain { get; set; }
        public bool pull { get; set; }
        public bool push { get; set; }
        public bool triage { get; set; }
        //Required for AppInfo permissions
        public string? issues { get; set; }
        public string? checks { get; set; }
        public string? metadata { get; set; }
        public string? contents { get; set; }
        public string? deployments { get; set; }
    }
}
