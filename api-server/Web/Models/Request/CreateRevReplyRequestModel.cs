namespace CS.Web.Models.Api.Request
{
    public class CreateRevReplyRequestModel
    {
        public string? body { get; set; }
        public int replyToId { get; set; }
    }
}
