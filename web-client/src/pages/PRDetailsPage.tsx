import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import { Box, Badge, rem, Group, UnstyledButton } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import { IconGitPullRequest } from "@tabler/icons-react";
import PrContextTab from "../tabs/PrContextTab.tsx";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import PRSummaryBox from "../components/PRCreate/PRSummaryBox";
import { Assignee, Label, Reviewer } from "../components/PRDetailSideBar.tsx";

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
  requestedReviewers: Reviewer[];
  assignees: Assignee[];
  mergeable: boolean;
}

export type PRDetailsPageTabName = "comments" | "commits" | "details" | "reviews";
const tabs: PRDetailsPageTabName[] = ["comments", "commits", "details", "reviews"];

export interface PRDetailsPageProps {
  tab?: PRDetailsPageTabName;
}

function PRDetailsPage(props: PRDetailsPageProps) {
  const { owner, repoName, prnumber } = useParams();
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);

  const currentTab = props.tab ?? tabs[0];

  useEffect(() => {
    const fetchPRInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:5018/api/github/pullrequest/${owner}/${repoName}/${prnumber}`, {
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
          {pullRequest?.title ?? "Loading"}
          <span style={{ color: "#778DA9" }}> #{prnumber}</span>
        </h2>
        &ensp;&ensp;
        <Badge
          size="lg"
          color={pullRequest?.draft ? "#778DA9" : "green"}
          key={1}
          rightSection={<IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />}
        >
          {pullRequest?.draft ? "Draft" : "Open"}
        </Badge>
      </Group>
      <Group mb="sm">
        <span style={{ color: "#778DA9" }}>Last updated </span>
        <Group>
          {" "}
          {new Date(pullRequest?.updatedAt ?? "Loading").toDateString()}
          <span style={{ color: "#778DA9" }}>by </span>
          <Group>
            <UnstyledButton component="a" href={pullRequest?.user.htmlUrl} target="_blank" c="blue">
              {pullRequest?.user.login ?? "Loading"}
            </UnstyledButton>
          </Group>
        </Group>
        <span style={{ color: "#778DA9" }}> at project</span>
        <UnstyledButton component="a" href={pullRequest?.base.repository.htmlUrl} target="_blank" c="blue">
          {repoName}
        </UnstyledButton>
      </Group>
      <Box w="50%">
        <PRSummaryBox
          numFiles={pullRequest?.changedFiles ?? 0}
          numCommits={pullRequest?.commits ?? 0}
          addedLines={pullRequest?.additions ?? 0}
          deletedLines={pullRequest?.deletions ?? 0}
        />
      </Box>

      <Box>
        <br />
        <TabComp tabs={tabs} currentTab={currentTab} />
        <br />
        <Box>
          {currentTab === "reviews" && <ModifiedFilesTab />}
          {currentTab === "comments" && pullRequest && <CommentsTab pullRequest={pullRequest} />}
          {currentTab === "details" && <PrContextTab />}
          {currentTab === "commits" && <CommitsTab />}
        </Box>
      </Box>
    </div>
  );
}

export default PRDetailsPage;
