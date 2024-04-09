import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import { Box, Badge, rem, Group, UnstyledButton } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import { IconGitPullRequest } from "@tabler/icons-react";
import PrDetailTab from "../tabs/PrDetailTab.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import PRSummaryBox from "../components/PRCreate/PRSummaryBox";
import { Assignee, Label, Reviewer } from "../components/PRDetailSideBar.tsx";
import { Check, Review } from "../models/PRInfo.tsx";
import { BASE_URL } from "../env.ts";

export interface PullRequest {
  title: string;
  draft: boolean;
  updatedAt: string;
  user: {
    htmlUrl: string;
    login: string;
  };
  changedFiles: number;
  additions: number;
  deletions: number;
  commits: number;
  base: {
    repository: {
      htmlUrl: string;
    };
  };
  labels: Label[];
  reviews: Reviewer[];
  assignees: Assignee[];
  mergeable: boolean;
  merged: boolean;
  closedAt: string;
}

export interface PRDetail {
  pull: PullRequest;
  checks: Check[];
  reviews: Review[];
  reviewers: string[]; //duplicate I guess
  checksComplete: number;
  checksIncomplete: number;
  checksSuccess: number;
  checksFail: number;
}

export type PRDetailsPageTabName = "comments" | "commits" | "details" | "reviews";
const tabs: PRDetailsPageTabName[] = ["comments", "commits", "details", "reviews"];

export interface PRDetailsPageProps {
  tab?: PRDetailsPageTabName;
}

function PRDetailsPage(props: PRDetailsPageProps) {
  const { owner, repoName, prnumber } = useParams();
  const [pullRequest, setPullRequest] = useState<PRDetail | null>(null);

  const currentTab = props.tab ?? tabs[0];

  useEffect(() => {
    const fetchPRInfo = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}`, {
          withCredentials: true,
        });
        if (res) {
          setPullRequest(res.data);
          console.log("fff", res.data);
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };
    fetchPRInfo();
  }, [owner, prnumber, repoName]);

  return (
    <div style={{ textAlign: "left", marginLeft: 100 }}>
      <Group>
        <h2>
          {" "}
          {pullRequest?.pull.title ?? "Loading"}
          <span style={{ color: "#778DA9" }}> #{prnumber}</span>
        </h2>
        &ensp;&ensp;
        <Badge
          size="lg"
          color={pullRequest?.pull.merged ? "purple" : pullRequest?.pull.closedAt != null ? "#778DA9" : "green"}
          key={1}
          rightSection={<IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />}
        >
          {pullRequest?.pull.merged ? "Merged" : pullRequest?.pull.closedAt != null ? "Closed" : "Open"}
        </Badge>
      </Group>
      <Group mb="sm">
        <span style={{ color: "#778DA9" }}>Last updated </span>
        <Group>
          {" "}
          {new Date(pullRequest?.pull.updatedAt ?? "Loading").toDateString()}
          <span style={{ color: "#778DA9" }}>by </span>
          <Group>
            <UnstyledButton component="a" href={pullRequest?.pull.user.htmlUrl} target="_blank" c="blue">
              {pullRequest?.pull.user.login ?? "Loading"}
            </UnstyledButton>
          </Group>
        </Group>
        <span style={{ color: "#778DA9" }}> at project</span>
        <UnstyledButton component="a" href={pullRequest?.pull.base.repository.htmlUrl} target="_blank" c="blue">
          {repoName}
        </UnstyledButton>
      </Group>
      <Box w="50%">
        <PRSummaryBox
          numFiles={pullRequest?.pull.changedFiles ?? 0}
          numCommits={pullRequest?.pull.commits ?? 0}
          addedLines={pullRequest?.pull.additions ?? 0}
          deletedLines={pullRequest?.pull.deletions ?? 0}
        />
      </Box>

      <Box>
        <br />
        <TabComp tabs={tabs} currentTab={currentTab} />
        <br />
        <Box>
          {currentTab === "reviews" && <ModifiedFilesTab />}
          {currentTab === "comments" && pullRequest && (
            <CommentsTab pullRequest={pullRequest.pull} reviews={pullRequest.reviews} />
          )}
          {currentTab === "details" && pullRequest && <PrDetailTab pull={pullRequest} />}
          {currentTab === "commits" && <CommitsTab />}
        </Box>
      </Box>
    </div>
  );
}

export default PRDetailsPage;
