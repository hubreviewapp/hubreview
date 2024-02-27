import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import { Box, Badge, rem, Group, UnstyledButton } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import * as React from "react";
import { IconGitPullRequest } from "@tabler/icons-react";
import PrContextTab from "../tabs/PrContextTab.tsx";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import PRSummaryBox from "../components/PRCreate/PRSummaryBox";

function PRDetailsPage() {
  const { owner, repoName, prnumber } = useParams();
  const [pullRequest, setPullRequest] = useState(null);
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
      setTimeout(fetchPRInfo, 1000); // Retry after 3 seconds
    }
  };

  useEffect(() => {
    fetchPRInfo();
  }, []);

  const tabs = ["comments", "commits", "details", "modified files"];

  const [currentTab, setCurrentTab] = React.useState<string | null>(tabs[0]);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem("userLogin") === null) {
      navigate("/signIn");
    }
  }, [navigate]);

  const updateTab = (newTab: string | null) => {
    setCurrentTab(newTab);
  };

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
            <UnstyledButton component="a" href={pullRequest?.user.htmlUrl} c="blue">
              {pullRequest?.user.login ?? "Loading"}
            </UnstyledButton>
          </Group>
        </Group>
        <span style={{ color: "#778DA9" }}> at project</span>
        <UnstyledButton component="a" href={pullRequest?.base.repository.htmlUrl} c="blue">
          {repoName}
        </UnstyledButton>
      </Group>
      <Box w="50%">
        <PRSummaryBox numFiles={pullRequest?.changedFiles ?? 0} numCommits={pullRequest?.commits ?? 0} addedLines={pullRequest?.additions ?? 0} deletedLines={pullRequest?.deletions ?? 0}/>
      </Box>

      <Box>
        <br />
        <TabComp tabs={tabs} updateTab={updateTab} />
        <br />
        <Box>
          {currentTab === "modified files" && <ModifiedFilesTab />}
          {currentTab === "comments" && <CommentsTab pullRequest={pullRequest} />}
          {currentTab === "details" && <PrContextTab />}
          {currentTab === "commits" && <CommitsTab />}
        </Box>
      </Box>
    </div>
  );
}

export default PRDetailsPage;
