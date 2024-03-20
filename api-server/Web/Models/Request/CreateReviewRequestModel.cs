namespace CS.Web.Models.Api.Request
{
    public class CreateReviewRequestModel
    {
        public string? body { get; set; }
        public string? verdict { get; set; }
        public RevCommentRequestModel[]? comments { get; set; }
    }
}
