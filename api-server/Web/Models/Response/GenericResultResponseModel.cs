namespace CS.Web.Models.Api.Response
{
    // class definition
    public class GenericResultResponseModel
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? ErrorCode { get; set; }

        public static GenericResultResponseModel FailureFrom(string errorMessage, string errorCode)
        {
            return new GenericResultResponseModel
            {
                IsSuccess = false,
                ErrorMessage = errorMessage,
                ErrorCode = errorCode
            };
        }

        public static GenericResultResponseModel SuccessfulResult { get; } = new GenericResultResponseModel
        {
            IsSuccess = true,
            ErrorMessage = string.Empty,
            ErrorCode = string.Empty
        };
    }
}
