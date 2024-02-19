namespace CS.Core.Entities
{
  public class BaseInfo
  {
    public string? label { get; set; }
    public string? @ref { get; set; }
    public RepositoryInfo repo { get; set; }
    public string? sha { get; set; }
    public UserInfo? user { get; set; }
  }
}
