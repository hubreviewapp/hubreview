import { Container, Pagination } from "@mantine/core";
import FilterInput from "../components/ReviewQueue/FilterInput";
import PullRequestCard from "../components/ReviewQueue/PullRequestCard";
import classes from "../components/ReviewQueue/ReviewQueue.module.scss";

export interface RequestedReviewer {
  reviewerType: "USER" | "TEAM";
  name: string;
  fileCount: number;
  reviewTypes: string[];
  comments?: string[]; // IDs of comments to be reviewed, if any
  result?: "APPROVED" | "REQUESTED_CHANGES";
}

export interface ReviewComment {
  label: "NITPICK" | "SUGGESTION" | "ISSUE" | "QUESTION";
  decorations: {
    blocking: boolean;
  };
}

export interface PrereviewCheck {
  name: string;
  passed: boolean;
}

export interface ReviewQueuePullRequest {
  id: number;
  title: string;
  author: string;
  creationTimestamp: number;
  terminationTimestamp?: number;
  lastActivityTimestamp?: number;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  labels: string[]; // Use for urgency too
  reviewers: RequestedReviewer[];
  assignees: string[];
  diffstat: {
    additions: number;
    deletions: number;
    fileCount: number;
  };
  contextComment?: string;
  ciChecks: {
    passedCount: number;
    failedCount: number;
    totalCount: number;
    prereviewChecks: PrereviewCheck[]; // i.e., lint, format
  };
  comments: ReviewComment[];
  reviewLoad: {
    estimatedLoad: "HIGH" | "MEDIUM" | "LOW";
    previouslyApproved: boolean;
  };
}

const data: ReviewQueuePullRequest[] = [
  {
    id: 1,
    title: "fix: unauthorized route execution",
    author: "Ece-Kahraman",
    creationTimestamp: 0,
    terminationTimestamp: 0,
    lastActivityTimestamp: 0,
    state: "OPEN",
    isDraft: false,
    labels: ["bug", "priority:high"],
    reviewers: [
      {
        name: "SecOps Team",
        reviewerType: "TEAM",
        reviewTypes: ["Domain 1", "Security"],
        comments: ["1", "2"],
        fileCount: 3,
        result: undefined,
      },
    ],
    assignees: [],
    diffstat: {
      additions: 121,
      deletions: 32,
      fileCount: 10,
    },
    contextComment: "Quick fix for the bug causing the ongoing incident, please take a look ASAP",
    ciChecks: {
      passedCount: 2,
      failedCount: 0,
      totalCount: 7,
      prereviewChecks: [
        {
          name: "Format",
          passed: true,
        },
        {
          name: "Lint",
          passed: true,
        },
      ],
    },
    comments: [
      {
        label: "SUGGESTION",
        decorations: {
          blocking: false,
        },
      },
      {
        label: "SUGGESTION",
        decorations: {
          blocking: false,
        },
      },
      {
        label: "NITPICK",
        decorations: {
          blocking: false,
        },
      },
    ],
    reviewLoad: {
      estimatedLoad: "LOW",
      previouslyApproved: true,
    },
  },
  {
    id: 2,
    title: "feat: implement resolver for Foo",
    author: "AlperMumcular",
    creationTimestamp: 0,
    terminationTimestamp: 0,
    lastActivityTimestamp: 0,
    state: "OPEN",
    isDraft: false,
    labels: ["enhancement", "priority:medium"],
    reviewers: [
      {
        name: "vedxyz",
        reviewerType: "USER",
        reviewTypes: ["Domain 2", "Engineering Excellence"],
        comments: undefined,
        fileCount: 12,
        result: undefined,
      },
    ],
    assignees: [],
    diffstat: {
      additions: 475,
      deletions: 233,
      fileCount: 12,
    },
    contextComment:
      "Hi @vedxyz, could you check whether the components here are sufficiently decoupled per our design goals?",
    ciChecks: {
      passedCount: 1,
      failedCount: 1,
      totalCount: 7,
      prereviewChecks: [
        {
          name: "Format",
          passed: true,
        },
        {
          name: "Lint",
          passed: false,
        },
      ],
    },
    comments: [
      {
        label: "ISSUE",
        decorations: {
          blocking: true,
        },
      },
      {
        label: "QUESTION",
        decorations: {
          blocking: true,
        },
      },
      {
        label: "SUGGESTION",
        decorations: {
          blocking: false,
        },
      },
    ],
    reviewLoad: {
      estimatedLoad: "HIGH",
      previouslyApproved: false,
    },
  },
];

/**
 * Here is a preliminary, non-exhaustive list of things that should be displayed on this page:
 * - Author-assigned urgency and contextual comment (i.e., more useful metadata)
 * - Type of review requested (Domain, Engineering Excellence, Custom, ...)
 * - File grouping
 * - Comment-specific reviewing
 * - Time since last activity (waiting duration)
 * - Overview of existing review comments
 * - Prereview CI checks
 * - Estimated review load of a PR (e.g., a reapproval is likely to be low-effort)
 */
function ReviewQueuePage() {
  return (
    <Container w="100%" mt="md">
      <FilterInput />

      {data.map((item) => (
        <PullRequestCard key={item.id} data={item} />
      ))}

      <Pagination classNames={{ root: classes.pagination }} color="primary" total={4} />
    </Container>
  );
}

export default ReviewQueuePage;
