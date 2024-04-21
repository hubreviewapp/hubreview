export interface APICurrentUser {
  login: string;
  avatarUrl?: string;
}

export enum APIMergeableState {
  MERGEABLE, CONFLICTING, UNKNOWN
}

export enum APIPullRequestReviewState {
  PENDING, COMMENTED, APPROVED, CHANGES_REQUESTED, DISMISSED
}

export enum APICheckConclusionState {
  ACTION_REQUIRED, TIMED_OUT, CANCELLED, FAILURE, SUCCESS, NEUTRAL, SKIPPED, STARTUP_FAILURE, STALE
}

export enum APICheckStatusState {
  REQUESTED, QUEUED, IN_PROGRESS, COMPLETED, WAITING, PENDING
}

export interface APIPullRequestReviewerUser {
  login: string;
  avatarUrl: string | null;
  url: string;
}

export interface APIPullRequestReviewerTeam {
  id: string;
  name: string;
  url: string;
}

export interface APIPullRequestReviewer {
  id: string;
  asCodeOwner: boolean;
  actor: APIPullRequestReviewerUser | APIPullRequestReviewerTeam
}

export interface APIPullRequestAssignee {
  id: string;
  login: string;
  avatarUrl: string | null;
}

export interface APIPullRequestDetails {
  title: string;
  author: {
    url: string;
    login: string;
  };
  changedFiles: {
    fileCount: number;
    lineAdditions: number;
    lineDeletions: number;
  };
  commitCount: number;
  labels: {
    id: string;
    name: string;
    description: string | null;
    color: string;
  }[];
  assignees: APIPullRequestAssignee[];
  reviewers: APIPullRequestReviewer[];
  reviews: {
    id: string;
    author: {
      login: string;
      avatarUrl: string | null;
    };
    state: APIPullRequestReviewState;
  }[];
  checkSuites: {
    id: string;
    conclusion: APICheckConclusionState | null;
    status: APICheckStatusState;
    workflowRun: {
      id: string;
      url: string;
      workflow: {
        workflowId: string;
        name: string;
      };
      checkRuns: {
        name: string;
        permalink: string;
        conclusion: APICheckConclusionState | null;
        status: APICheckStatusState;
      }[];
    } | null
  }[];
  isDraft: boolean;
  mergeable: APIMergeableState;
  merged: boolean;
  updatedAt: Date;
  closedAt: Date | null;
  pullRequestUrl: string;
  repositoryUrl: string;
}
