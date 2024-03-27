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
  //const [prInfo, setPrInfo] = useState<PRInfo[]>([]);
  const [needsYourReviewPRs, setNeedsYourReviewPRs] = useState<PRInfo[]>([]);
  const [yourPRs, setYourPRs] = useState<PRInfo[]>([]);
  const [waitingAuthorPRs, setWaitingAuthorPRs] = useState<PRInfo[]>([]);
  const [openPRs, setOpenPRs] = useState<PRInfo[]>([]);
  const [mergedPRs, setMergedPRs] = useState<PRInfo[]>([]);
  const [closedPRs, setClosedPRs] = useState<PRInfo[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  const [values, handlers] = useListState<SelectedRepos>([]);

  useEffect(() => {
    const fetchNeedsYourReviewPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/needsreview");

        if (res) {
          setNeedsYourReviewPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchNeedsYourReviewPRs();
  });

  useEffect(() => {
    const fetchYourPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/userprs");

        if (res) {
          setYourPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchYourPRs();
  });

  useEffect(() => {
    const fetchWaitingAuthorPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/waitingauthor");

        if (res) {
          setWaitingAuthorPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchWaitingAuthorPRs();
  });

  useEffect(() => {
    const fetchOpenPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/open");

        if (res) {
          setOpenPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchOpenPRs();
  });

  useEffect(() => {
    const fetchMergedPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/merged");

        if (res) {
          setMergedPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchMergedPRs();
  });

  useEffect(() => {
    const fetchClosedPRs = async () => {
      try {
        const res = await axios
          .create({
            withCredentials: true,
            baseURL: "http://localhost:5018/api/github",
          })
          .get("/prs/closed");

        if (res) {
          setClosedPRs(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchClosedPRs();
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
          <PRCardList pr={needsYourReviewPRs} name="Needs Your Review" />
        </div>
        <div id="your-prs">
          <PRCardList pr={yourPRs} name="Your PRs" />
        </div>
        <div id="waiting-for-author">
          <PRCardList pr={waitingAuthorPRs} name="Waiting for author" />
        </div>
        <div id="all-open-prs">
          <PRCardList pr={openPRs} name="All Open PRs" />
        </div>
        <div id="merged">
          <PRCardList pr={mergedPRs} name="Merged" />
        </div>
        <div id="closed">
          <PRCardList pr={closedPRs} name="Closed" />
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
