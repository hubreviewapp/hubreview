import { Grid, Button, Center } from "@mantine/core";
import FilterInput from "../components/ReviewQueue/FilterInput";
import { useEffect, useState } from "react";
import { useListState } from "@mantine/hooks";
import { PRNavbar } from "../components/ReviewQueue/PRNavbar.tsx";
import PRCardList from "../components/ReviewQueue/PRCardList";
import { PRInfo } from "../models/PRInfo";
import axios from "axios";
import { BASE_URL } from "../env.ts";

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

export interface FilterList {
  author: string | null;
  assignee: string | null;
  labels: string[];
  priority: string | null;
  fromDate: string | null | undefined;
  orderBy: string | null | undefined;
  repositories: string[];
  name: string;
}

const API = `${BASE_URL}/api/github/prs`;
function ReviewQueuePage() {
  //const [prInfo, setPrInfo] = useState<PRInfo[]>([]);
  const [needsYourReviewPRs, setNeedsYourReviewPRs] = useState<PRInfo[]>([]);
  const [waitingAuthorPRs, setWaitingAuthorPRs] = useState<PRInfo[]>([]);
  const [yourPRs, setYourPrs] = useState<PRInfo[]>([]);
  const [openPRs, setOpenPRs] = useState<PRInfo[]>([]);
  const [mergedPRs, setMergedPRs] = useState<PRInfo[]>([]);
  const [closedPRs, setClosedPRs] = useState<PRInfo[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");

  const [values, handlers] = useListState<SelectedRepos>([]);

  //filter options
  const [filterList, setFilterList] = useState<FilterList>({
    author: "",
    assignee: null,
    labels: [],
    priority: null,
    fromDate: null,
    orderBy: "priority",
    repositories: [],
    name: "",
  });

  useEffect(() => {
    const selectedRepositories = values.filter((repo) => repo.selected).map((repo) => repo.name);
    setFilterList((prevFilterList) => ({
      ...prevFilterList,
      repositories: selectedRepositories,
    }));
  }, [values]);

  const [closedLimit, setClosedLimit] = useState(10);
  const [mergedLimit, setMergedLimits] = useState(10);
  const [closedMax, setClosedMax] = useState(0);
  const [mergedMax, setMergedMax] = useState(0);

  // By `ignore`ing stale effects below, race conditions are prevented.
  // See for details: https://react.dev/reference/react/useEffect#fetching-data-with-effects

  useEffect(() => {
    let ignore = false;
    const fetchClosed = async () => {
      try {
        const res = await axios.post(`${API}/closed/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setClosedMax(res.data.length);
          setClosedPRs(res.data.slice(0, closedLimit));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchClosed();

    return () => {
      ignore = true;
    };
  }, [closedLimit, filterList]);

  useEffect(() => {
    let ignore = false;
    const fetchMerged = async () => {
      try {
        const res = await axios.post(`${API}/merged/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setMergedMax(res.data.length);
          setMergedPRs(res.data.slice(0, mergedLimit));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchMerged();

    return () => {
      ignore = true;
    };
  }, [mergedLimit, filterList]);
  useEffect(() => {
    let ignore = false;
    const fetchNeedsYourReviewPRs = async () => {
      try {
        const res = await axios.post(`${API}/needsreview/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setNeedsYourReviewPRs(res.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchNeedsYourReviewPRs();

    return () => {
      ignore = true;
    };
  }, [filterList]);

  useEffect(() => {
    let ignore = false;
    const fetchUserPrs = async () => {
      try {
        const res = await axios.post(`${API}/userprs/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setYourPrs(res.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchUserPrs();

    return () => {
      ignore = true;
    };
  }, [filterList]);

  useEffect(() => {
    let ignore = false;
    const fetchWaitingAuthor = async () => {
      try {
        const res = await axios.post(`${API}/waitingauthor/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setWaitingAuthorPRs(res.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchWaitingAuthor();

    return () => {
      ignore = true;
    };
  }, [filterList]);

  useEffect(() => {
    let ignore = false;
    const fetchOpenPRs = async () => {
      try {
        const res = await axios.post(`${API}/open/filter`, filterList, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (res.data !== undefined && !ignore) {
          setOpenPRs(res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchOpenPRs();

    return () => {
      ignore = true;
    };
  }, [filterList]);

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
        <FilterInput filterList={filterList} setFilterList={setFilterList} />
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
          <Center>
            <Button
              my="md"
              variant="outline"
              color="indigo"
              disabled={mergedMax <= mergedLimit}
              onClick={() => setMergedLimits(closedLimit + 10)}
            >
              Load More Merged PRs
            </Button>
          </Center>
        </div>
        <div id="closed">
          <PRCardList pr={closedPRs} name="Closed" />
          <Center>
            <Button
              my="md"
              variant="outline"
              color="indigo"
              disabled={closedMax <= closedLimit}
              onClick={() => setClosedLimit(closedLimit + 10)}
            >
              Load More Closed PRs
            </Button>
          </Center>
        </div>
      </Grid.Col>
    </Grid>
  );
}

export default ReviewQueuePage;
