namespace CS.Web.Models.Api.Request
{
    public class CreateReviewRequestModel
    {
        public string? body { get; set; }
        public string? filename { get; set; }
        public int position { get; set; }
        public string? label { get; set; }
        public string? decoration { get; set; }
        public string? verdict { get; set; }
    }
}
