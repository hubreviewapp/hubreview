import { Grid, Button, Center } from "@mantine/core";
import FilterInput from "../components/ReviewQueue/FilterInput";
import {Link} from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {PRNavbar} from "../components/ReviewQueue/PRNavbar.tsx";
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
  const navigate = useNavigate();


  useEffect(() => {

    if ( localStorage.getItem("userLogin") === null ){
      navigate("/signIn");
    }

    const fetchPRInfo = async () => {
      try {
        const res = await axios.create({
          withCredentials: true,
          baseURL: "http://localhost:5018/api/github"
        }).get("/prs");

        if (res) {
          setPrInfo(res.data);
          console.log("res: ", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
        // Retry fetching PR info after a delay
        setTimeout(fetchPRInfo, 1000); // Retry after 3 seconds
      }
    };

    fetchPRInfo();
  }, []);

  return (
    <Grid w="100%" mt="md">
      <Grid.Col span={3}>
        <PRNavbar/>
      </Grid.Col>

      <Grid.Col span={8}>
        <FilterInput />

        <PRCardList pr={prInfo} name="Needs Your Review" />
        <PRCardList pr={[]} name="Approved" />
        <PRCardList pr={[]} name="Your PRs" />

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
