namespace CS.Web.Utilities;

internal static class HttpContextExtensions
{
    internal static Guid GetUserId(this HttpContext context)
    {
        var userIdString = context.User.FindFirst(c => c.Type == "UserId")?.Value;
        return string.IsNullOrWhiteSpace(userIdString) ?
            throw new UnauthorizedAccessException() :
            Guid.Parse(userIdString);
    }
}

