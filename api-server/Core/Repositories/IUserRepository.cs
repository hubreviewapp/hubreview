using System;
using System.Threading.Tasks;
using CS.Core.Entities;

namespace CS.Core.Repositories
{
    public interface IUserRepository
    {
        Task<User> GetUserByIdAsync(Guid userId);
        // Add other methods for user-related data access operations
    }
}