namespace CS.Web.Models.Api.Request
{
    public class CreateReplyRequestModel
    {
        public string? body { get; set; }
        public int reply_to_id { get; set; }
    }
}
