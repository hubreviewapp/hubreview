import { Grid, Button, Center } from "@mantine/core";
import FilterInput from "../components/ReviewQueue/FilterInput";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useListState } from "@mantine/hooks";
import { PRNavbar } from "../components/ReviewQueue/PRNavbar.tsx";
import PRCardList from "../components/ReviewQueue/PRCardList";
import { PRInfo } from "../models/PRInfo";
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

export interface SelectedRepos {
  name: string;
  selected: boolean;
}

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
  const [prInfo, setPrInfo] = useState<PRInfo[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  const [values, handlers] = useListState<SelectedRepos>([]);

  useEffect(() => {
    const fetchPRInfo = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs");

        if (res) {
          setPrInfo(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchPRInfo();
  });

  return (
    <Grid mt="md">
      <Grid.Col span={3}>
        <div style={{ position: "sticky", top: 5 }}>
          <PRNavbar
            setActiveSection={setActiveSection}
            activeSection={activeSection}
            selectedRepos={values}
            setSelectedRepos={handlers}
          />
        </div>
      </Grid.Col>

      <Grid.Col span={8} ml="md">
        <FilterInput />
        <div id="needs-your-review">
          <PRCardList pr={prInfo} name="Needs Your Review" />
        </div>
        <div id="your-prs">
          <PRCardList pr={[]} name="Your PRs" />
        </div>
        <div id="waiting-for-author">
          <PRCardList pr={[]} name="Waiting for author" />
        </div>
        <div id="all-open-prs">
          <PRCardList pr={prInfo} name="All Open PRs" />
        </div>
        <div id="merged">
          <PRCardList pr={[]} name="Merged" />
        </div>
        <div id="closed">
          <PRCardList pr={prInfo} name="Closed" />
        </div>
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
