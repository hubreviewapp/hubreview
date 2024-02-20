//using System.ComponentModel.DataAnnotations;

namespace CS.Core.Entities
{
    public class User
    {
        // Primary key for the User entity
        public long UserId { get; set; }

        // User's name
        public string? UserName { get; set; }
    }
}
