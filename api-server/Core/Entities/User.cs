//using System.ComponentModel.DataAnnotations;

namespace CS.Core.Entities
{
    //
    // Summary:
    //     Base class for a GitHub account, most often either a Octokit.User or Octokit.Organization.
    public class User
    {
        //
        // Summary:
        //     URL of the account's avatar.
        public string AvatarUrl { get; set; }

        //
        // Summary:
        //     The account's bio.
        public string Bio { get; protected set; }

        //
        // Summary:
        //     URL of the account's blog.
        public string Blog { get; protected set; }

        //
        // Summary:
        //     Number of collaborators the account has.
        public int? Collaborators { get; protected set; }

        //
        // Summary:
        //     Company the account works for.
        public string Company { get; protected set; }

        //
        // Summary:
        //     Date the account was created.
        public DateTimeOffset CreatedAt { get; protected set; }

        //
        // Summary:
        //     Amount of disk space the account is using.
        public int? DiskUsage { get; protected set; }

        //
        // Summary:
        //     The account's email.
        public string Email { get; protected set; }

        //
        // Summary:
        //     Number of followers the account has.
        public int Followers { get; protected set; }

        //
        // Summary:
        //     Number of other users the account is following.
        public int Following { get; protected set; }

        //
        // Summary:
        //     Indicates whether the account is currently hireable.
        //
        // Value:
        //     True if the account is hireable; otherwise, false.
        public bool? Hireable { get; protected set; }

        //
        // Summary:
        //     The HTML URL for the account on github.com (or GitHub Enterprise).
        public string HtmlUrl { get; protected set; }

        //
        // Summary:
        //     The account's system-wide unique Id.
        public int Id { get; protected set; }

        //
        // Summary:
        //     GraphQL Node Id
        public string NodeId { get; protected set; }

        //
        // Summary:
        //     The account's geographic location.
        public string Location { get; protected set; }

        //
        // Summary:
        //     The account's login.
        public string Login { get; set; }

        //
        // Summary:
        //     The account's full name.
        public string Name { get; protected set; }

        //
        // Summary:
        //     The type of account associated with this entity
        //
        // Summary:
        //     Number of private repos owned by the account.
        public int OwnedPrivateRepos { get; protected set; }

        //
        // Summary:
        //     Plan the account pays for.


        //
        // Summary:
        //     Number of private gists the account has created.
        public int? PrivateGists { get; protected set; }

        //
        // Summary:
        //     Number of public gists the account has created.
        public int PublicGists { get; protected set; }

        //
        // Summary:
        //     Number of public repos the account owns.
        public int PublicRepos { get; protected set; }

        //
        // Summary:
        //     Total number of private repos the account owns.
        public int TotalPrivateRepos { get; protected set; }

        //
        // Summary:
        //     The account's API URL.
        public string Url { get; protected set; }

    }
    /*
    public class User
    {
        // Primary key for the User entity
        public long UserId { get; set; }

        // User's name
        public string? UserName { get; set; }
    } */
}
