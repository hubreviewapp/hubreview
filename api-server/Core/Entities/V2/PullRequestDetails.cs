using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Octokit.GraphQL;
using static Octokit.GraphQL.Variable;

namespace CS.Core.Entities.V2;

public class PullRequestDetails
{
    public class AuthorDetails
    {
        public required string Url { get; set; }
        public required string Login { get; set; }
    }

    public class HeadCommitDetails
    {
        public required string TreeUrl { get; set; }
    }

    public class ChangedFileDetails
    {
        public required int FileCount { get; set; }
        public required int LineAdditions { get; set; }
        public required int LineDeletions { get; set; }
    }

    public class LabelDetails
    {
        public required Octokit.GraphQL.ID Id { get; set; }
        public required string Name { get; set; }
        public required string? Description { get; set; }
        public required string Color { get; set; }
    }

    public class AssigneeDetails
    {
        public required Octokit.GraphQL.ID Id { get; set; }
        public required string Login { get; set; }
        public required string? AvatarUrl { get; set; }
    }

    public class ReviewerDetails
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public enum ReviewerType
        {
            USER, TEAM
        }

        public abstract class ReviewerActorDetails
        {
            public required ReviewerType Type { get; set; }
        }

        public class ReviewerUserDetails : ReviewerActorDetails
        {
            public required string Login { get; set; }
            public required string? AvatarUrl { get; set; }
            public required string Url { get; set; }
        }

        public class ReviewerTeamDetails : ReviewerActorDetails
        {
            public required Octokit.GraphQL.ID Id { get; set; }
            public required string Name { get; set; }
            public required string Url { get; set; }
        }

        public required Octokit.GraphQL.ID Id { get; set; }
        public required bool AsCodeOwner { get; set; }
        public required ReviewerActorDetails Actor { get; set; }
    }

    public class ReviewDetails
    {
        public class AuthorDetails
        {
            public required string Login { get; set; }
            public required string? AvatarUrl { get; set; }
        }

        public required Octokit.GraphQL.ID Id { get; set; }
        public required DateTimeOffset CreatedAt { get; set; }
        public required AuthorDetails Author { get; set; }
        public required Octokit.GraphQL.Model.PullRequestReviewState State { get; set; }
    }

    public class CheckSuiteDetails
    {
        public class WorkflowRunDetails
        {
            public required Octokit.GraphQL.ID Id { get; set; }
            public required string Url { get; set; }
            public required WorkflowDetails Workflow { get; set; }
            public required List<CheckRunDetails> CheckRuns { get; set; }
        }

        public class WorkflowDetails
        {
            public required Octokit.GraphQL.ID WorkflowId { get; set; }
            public required string Name { get; set; }
        }

        public class CheckRunDetails
        {
            public required string Name { get; set; }
            public required string Permalink { get; set; }
            public required Octokit.GraphQL.Model.CheckConclusionState? Conclusion { get; set; }
            public required Octokit.GraphQL.Model.CheckStatusState Status { get; set; }
        }

        public required Octokit.GraphQL.ID Id { get; set; }
        public required Octokit.GraphQL.Model.CheckConclusionState? Conclusion { get; set; }
        public required Octokit.GraphQL.Model.CheckStatusState Status { get; set; }
        public required WorkflowRunDetails? WorkflowRun { get; set; }
    }

    public static class MergeStateStatusEnum
    {
        [JsonConverter(typeof(StringEnumConverter))]
        public enum Enum
        {
            BEHIND,
            BLOCKED,
            CLEAN,
            DIRTY,
            DRAFT,
            HAS_HOOKS,
            UNKNOWN,
            UNSTABLE
        }

        public static Enum? From(Octokit.MergeableState? restApiEnum) => restApiEnum is null ?
            null :
            restApiEnum switch
            {
                Octokit.MergeableState.Behind => Enum.BEHIND,
                Octokit.MergeableState.Blocked => Enum.BLOCKED,
                Octokit.MergeableState.Clean => Enum.CLEAN,
                Octokit.MergeableState.Dirty => Enum.DIRTY,
                Octokit.MergeableState.Draft => Enum.DRAFT,
                Octokit.MergeableState.HasHooks => Enum.HAS_HOOKS,
                Octokit.MergeableState.Unknown => Enum.UNKNOWN,
                Octokit.MergeableState.Unstable => Enum.UNSTABLE,
                _ => throw new ArgumentOutOfRangeException(nameof(restApiEnum), $"Unknown value {restApiEnum}")
            };
    }

    public required string Title { get; set; }
    public required string Body { get; set; }
    public required AuthorDetails Author { get; set; }
    public required string BaseRefName { get; set; }
    public required HeadCommitDetails HeadCommit { get; set; }
    public required ChangedFileDetails ChangedFiles { get; set; }
    public required int CommitCount { get; set; }
    public required List<LabelDetails> Labels { get; set; }
    public required List<AssigneeDetails> Assignees { get; set; }
    public required List<ReviewerDetails> Reviewers { get; set; }
    public required List<ReviewDetails> Reviews { get; set; }
    public required List<CheckSuiteDetails> CheckSuites { get; set; }
    public required bool IsDraft { get; set; }
    public required Octokit.GraphQL.Model.MergeableState Mergeable { get; set; }
    public required MergeStateStatusEnum.Enum? MergeStateStatus { get; set; }
    public required bool Merged { get; set; }
    public required DateTimeOffset UpdatedAt { get; set; }
    public required DateTimeOffset? ClosedAt { get; set; }
    public required string PullRequestUrl { get; set; }
    public required string RepositoryUrl { get; set; }

    public static Octokit.GraphQL.ICompiledQuery<PullRequestDetails> GetQuery()
    {
        return new Query()
            .Repository(Var("repoName"), Var("owner"))
            .PullRequest(Var("prNumber"))
            .Select(pr => new PullRequestDetails
            {
                Title = pr.Title,
                Body = pr.Body,
                Author = new()
                {
                    Url = pr.Author.Url,
                    Login = pr.Author.Login,
                },
                BaseRefName = pr.BaseRef.Name,
                HeadCommit = new()
                {
                    // The Octokit GraphQL library does not allow fetching the last commit here...
                    // So we assume we can fetch a "page" of commits and get the last one as the "head commit".
                    TreeUrl = pr.Commits(null, null, null, null).Nodes.Select(c => c.Commit.TreeUrl).ToList().Last(),
                },
                ChangedFiles = new()
                {
                    FileCount = pr.ChangedFiles,
                    LineAdditions = pr.Additions,
                    LineDeletions = pr.Deletions,
                },
                CommitCount = pr.Commits(null, null, null, null).TotalCount,
                Labels = pr.Labels(null, null, null, null, null)
                    .AllPages()
                    .Select(l => new PullRequestDetails.LabelDetails
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Color = l.Color,
                        Description = l.Description,
                    })
                    .ToList(),
                Assignees = pr.Assignees(null, null, null, null)
                    .AllPages()
                    .Select(a => new PullRequestDetails.AssigneeDetails
                    {
                        Id = a.Id,
                        Login = a.Login,
                        AvatarUrl = a.AvatarUrl(null),
                    })
                    .ToList(),
                Reviewers = pr.ReviewRequests(null, null, null, null)
                    .AllPages()
                    .Select(r => new PullRequestDetails.ReviewerDetails
                    {
                        Id = r.Id,
                        AsCodeOwner = r.AsCodeOwner,
                        Actor = r.RequestedReviewer.Switch<PullRequestDetails.ReviewerDetails.ReviewerActorDetails>(when =>
                            when
                                .User(u => new PullRequestDetails.ReviewerDetails.ReviewerUserDetails
                                {
                                    Type = ReviewerDetails.ReviewerType.USER,
                                    Login = u.Login,
                                    AvatarUrl = u.AvatarUrl(null),
                                    Url = u.Url,
                                })
                                .Team(t => new PullRequestDetails.ReviewerDetails.ReviewerTeamDetails
                                {
                                    Type = ReviewerDetails.ReviewerType.TEAM,
                                    Id = t.Id,
                                    Name = t.Name,
                                    Url = t.Url,
                                })
                        ),
                    })
                    .ToList(),
                Reviews = pr.Reviews(null, null, null, null, null, null)
                    .AllPages()
                    .Select(r => new PullRequestDetails.ReviewDetails
                    {
                        Id = r.Id,
                        CreatedAt = r.CreatedAt,
                        Author = new PullRequestDetails.ReviewDetails.AuthorDetails
                        {
                            Login = r.Author.Login,
                            AvatarUrl = r.Author.AvatarUrl(null),
                        },
                        State = r.State,
                    })
                    .ToList(),
                CheckSuites = pr.Commits(null, null, 1, null).Nodes
                    .Select(prCommit =>
                        prCommit.Commit.CheckSuites(null, null, null, null, null)
                        .AllPages()
                        .Select(cs => new PullRequestDetails.CheckSuiteDetails
                        {
                            Id = cs.Id,
                            Conclusion = cs.Conclusion,
                            Status = cs.Status,
                            WorkflowRun = cs.WorkflowRun.Select(wr => new PullRequestDetails.CheckSuiteDetails.WorkflowRunDetails
                            {
                                Id = wr.Id,
                                Url = wr.Url,
                                Workflow = new PullRequestDetails.CheckSuiteDetails.WorkflowDetails
                                {
                                    WorkflowId = wr.Workflow.Id,
                                    Name = wr.Workflow.Name,
                                },
                                CheckRuns = wr.CheckSuite.CheckRuns(null, null, null, null, null)
                                    .AllPages()
                                    .Select(cr => new PullRequestDetails.CheckSuiteDetails.CheckRunDetails
                                    {
                                        Name = cr.Name,
                                        Permalink = cr.Permalink,
                                        Conclusion = cr.Conclusion,
                                        Status = cr.Status,
                                    }).ToList(),
                            }).SingleOrDefault(),
                        }).ToList()
                    ).ToList().SelectMany(x => x).ToList(),
                IsDraft = pr.IsDraft,
                Mergeable = pr.Mergeable,
                MergeStateStatus = PullRequestDetails.MergeStateStatusEnum.Enum.UNKNOWN, // Updated through REST API
                Merged = pr.Merged,
                UpdatedAt = pr.UpdatedAt,
                ClosedAt = pr.ClosedAt,
                PullRequestUrl = pr.Url,
                RepositoryUrl = pr.BaseRepository.Url,
            }).Compile();
    }
}
