namespace CS.Web.Models.Api.Request
{
    public class RevCommentRequestModel
    {
        public string? message { get; set; }
        public string? filename { get; set; }
        public int position { get; set; }
        public string? label { get; set; }
        public string? decoration { get; set; }

    }
}
