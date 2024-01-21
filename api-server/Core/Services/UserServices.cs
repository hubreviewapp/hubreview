using System;
using System.Threading.Tasks;
using CS.Core.Entities;
using CS.Core.Repositories;
using CS.Web.Models.Api.Response;

namespace CS.Core.Services
{
    public class UserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserProfileDataResponseModel> GetProfileDataAsync(Guid userId, bool selfRequest)
        {
            
        }

        /*public async Task<> UpdateUserAsync()
        {

        }*/
    }
}