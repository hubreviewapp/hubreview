namespace CS.Core.Entities
{
  public class PermissionsInfo
  {
    public bool admin { get; set; }
    public bool maintain { get; set; }
    public bool pull { get; set; }
    public bool push { get; set; }
    public bool triage { get; set; }
  }
}
