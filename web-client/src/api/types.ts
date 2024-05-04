export interface APICurrentUser {
  login: string;
  avatarUrl?: string;
}

export enum APIMergeableState {
  MERGEABLE = "MERGEABLE",
  CONFLICTING = "CONFLICTING",
  UNKNOWN = "UNKNOWN",
}

export enum APIMergeStateStatus {
  BEHIND = "BEHIND",
  BLOCKED = "BLOCKED",
  CLEAN = "CLEAN",
  DIRTY = "DIRTY",
  DRAFT = "DRAFT",
  HAS_HOOKS = "HAS_HOOKS",
  UNKNOWN = "UNKNOWN",
  UNSTABLE = "UNSTABLE",
}

export enum APIPullRequestReviewState {
  PENDING = "PENDING",
  COMMENTED = "COMMENTED",
  APPROVED = "APPROVED",
  CHANGES_REQUESTED = "CHANGES_REQUESTED",
  DISMISSED = "DISMISSED",
}

export enum APICheckConclusionState {
  ACTION_REQUIRED = "ACTION_REQUIRED",
  TIMED_OUT = "TIMED_OUT",
  CANCELLED = "CANCELLED",
  FAILURE = "FAILURE",
  SUCCESS = "SUCCESS",
  NEUTRAL = "NEUTRAL",
  SKIPPED = "SKIPPED",
  STARTUP_FAILURE = "STARTUP_FAILURE",
  STALE = "STALE",
}

export enum APICheckStatusState {
  REQUESTED = "REQUESTED",
  QUEUED = "QUEUED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  WAITING = "WAITING",
  PENDING = "PENDING",
}

export enum APIPullRequestReviewerActorType {
  USER = "USER",
  TEAM = "TEAM",
}

export interface APIPullRequestReviewerActor {
  type: APIPullRequestReviewerActorType;
}

export interface APIPullRequestReviewerUser extends APIPullRequestReviewerActor {
  type: APIPullRequestReviewerActorType.USER;
  login: string;
  avatarUrl: string | null;
  url: string;
}

export interface APIPullRequestReviewerTeam extends APIPullRequestReviewerActor {
  type: APIPullRequestReviewerActorType.TEAM;
  id: string;
  name: string;
  url: string;
}

export interface APIPullRequestReviewer {
  id: string;
  asCodeOwner: boolean;
  actor: APIPullRequestReviewerUser | APIPullRequestReviewerTeam;
}

export interface APIPullRequestReviewMetadata {
  id: string;
  createdAt: Date;
  author: {
    login: string;
    avatarUrl: string | null;
  };
  state: APIPullRequestReviewState;
}

export interface APIPullRequestAssignee {
  id: string;
  login: string;
  avatarUrl: string | null;
}

export interface APIPullRequestDetails {
  title: string;
  body: string;
  author: {
    url: string;
    login: string;
  };
  baseRefName: string;
  headCommit: {
    treeUrl: string;
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
  reviews: APIPullRequestReviewMetadata[];
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
    } | null;
  }[];
  isDraft: boolean;
  mergeable: APIMergeableState;
  mergeStateStatus: APIMergeStateStatus | null;
  merged: boolean;
  updatedAt: Date;
  closedAt: Date | null;
  pullRequestUrl: string;
  repositoryUrl: string;
}
