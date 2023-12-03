using CS.Core.Entities;
using CS.Core.Exceptions;
using CS.Core.Models.Api.Request;
using CS.Core.Models.Api.Response;
using CS.Core.Repositories;
using CS.Core.Services;
using CS.Web.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CS.Web.Controllers;

[ApiController]
[Route("api/[controller]s")]
[Produces("application/json")]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly UserService _userService;

    public UserController(UserService userService, IUserRepository userRepository)
    {
        _userService = userService;
        _userRepository = userRepository;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = HttpContext.GetUserId();

        UserProfileDataResponseModel profileData;
        try
        {
            profileData = await _userService.GetProfileDataAsync(userId, selfRequest: true);
        }
        catch (NotFoundException)
        {
            return NotFound("No user found with ID");
        }

        return Ok(profileData);
    }

    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetUserProfileData(Guid userId)
    {
        bool isSelfRequest = false;
        try { isSelfRequest = HttpContext.GetUserId() == userId; }
        catch (UnauthorizedAccessException) { }

        UserProfileDataResponseModel profileData;
        try
        {
            profileData = await _userService.GetProfileDataAsync(userId, isSelfRequest);
        }
        catch (NotFoundException)
        {
            return NotFound("No user found with ID");
        }

        return Ok(profileData);
    }

    [HttpPatch("{userId:guid}")]
    public async Task<IActionResult> UpdateUser(
        Guid userId,
        [FromBody] UpdateUserRequestModel UpdateUserRequestModel)
    {
        User user;
        try
        {
            user = await _userService.UpdateUserAsync(userId, UpdateUserRequestModel);
        }
        catch (BadRequestException)
        {
            return BadRequest(GenericResultResponseModel.FailureFrom("Cannot update the user information!"));
        }
        catch (NotFoundException)
        {
            return NotFound(GenericResultResponseModel.FailureFrom("Cannot find user with given ID"));
        }

        return Ok(GenericResultResponseModel.SuccessfulResult);
    }
}

