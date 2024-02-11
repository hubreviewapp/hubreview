import { Grid, Button, Center } from "@mantine/core";
import FilterInput from "../components/ReviewQueue/FilterInput";
import {Link} from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {PRNavbar} from "../components/ReviewQueue/PRNavbar.tsx";
import PRCardList from "../components/ReviewQueue/PRCardList";
import { PRInfo } from "../models/PRInfo.tsx";
import axios from "axios";

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
 * - DiffComment-specific reviewing
 * - Time since last activity (waiting duration)
 * - Overview of existing review comments
 * - Prereview CI checks
 * - Estimated review load of a PR (e.g., a reapproval is likely to be low-effort)
 */
function ReviewQueuePage() {
  const navigate = useNavigate();
  const [prInfo, setPrInfo] = useState<PRInfo[]>([]);

  useEffect(() => {
  if ( localStorage.getItem("userLogin") === null ){
    navigate("/signIn");
  } else {

    const fetchPRInfo = async () => {
      try {
        const res = await axios.create({
          withCredentials: true,
          baseURL: "http://localhost:5018/api/github"
        }).get("prs");
  
        if (res) {
          setPrInfo(res.data.PRInfos);
        }
      } catch (error) {
        // Handle error if needed
        console.error('Error fetching PR info:', error);
      }
    };
  
    fetchPRInfo();
  }

  
  }, [navigate]);

  console.log(prInfo[0]);

  return (
    <Grid w="100%" mt="md">
      <Grid.Col span={3}>
        <PRNavbar/>
      </Grid.Col>

      <Grid.Col span={8}>
        <FilterInput />

        {/*<PRCardList pr={[]} name="Needs Your Review" />*/}
        <PRCardList pr={prInfo} name="Approved" />
        <PRCardList pr={[prInfo[0]]} name="Your PRs" />

        <Center>
          <Link to="/createPR">
            <Button m="lg">Create New PR</Button>
          </Link>
        </Center>
      </Grid.Col>
    </Grid>
  );
}

export default ReviewQueuePage;
