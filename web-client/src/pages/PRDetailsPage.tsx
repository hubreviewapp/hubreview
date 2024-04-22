import { useEffect, useState } from "react";
import axios from "axios";
import { IconGitMerge, IconGitPullRequest, IconGitPullRequestClosed } from "@tabler/icons-react";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import { Box, Badge, rem, Group, UnstyledButton, Anchor, Center, Loader, Text } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import PrDetailTab from "../tabs/PrDetailTab.tsx";
import { Params, useParams } from "react-router-dom";
import PRSummaryBox from "../components/PRCreate/PRSummaryBox";
import { apiHooks } from "../api/apiHooks.ts";
import { BASE_URL } from "../env.ts";

export type PRDetailsPageTabName = "comments" | "commits" | "summary" | "reviews";
const tabs: PRDetailsPageTabName[] = ["comments", "commits", "summary", "reviews"];

export interface PRDetailsPageParams {
  owner: string;
  repoName: string;
  prNumber: number;
}

const processParams = (rawParams: Params<string>): PRDetailsPageParams => {
  const { owner, repoName, prnumber } = rawParams;
  if (owner === undefined || repoName === undefined || prnumber === undefined) throw Error("Missing params in router");
  return {
    owner,
    repoName,
    prNumber: parseInt(prnumber),
  };
};

export interface PRDetailsPageProps {
  tab?: PRDetailsPageTabName;
}

export interface MergeInfo {
  isConflict: boolean;
  requiredApprovals: number;
  requiredChecks: string[];
}

function PRDetailsPage(props: PRDetailsPageProps) {
  const { owner, repoName, prNumber } = processParams(useParams());
  const currentTab = props.tab ?? tabs[0];
  const mergeIcon = <IconGitMerge style={{ width: rem(18), height: rem(18) }} />;
  const openIcon = <IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />;
  const closeIcon = <IconGitPullRequestClosed style={{ width: rem(18), height: rem(18) }} />;

  const { data: pullRequestData, isLoading: isLoadingPullRequestData } = apiHooks.pullRequests.useGetByNumberQuery(
    owner,
    repoName,
    prNumber,
  );
  const pullRequestDetails = pullRequestData?.data;

  const [mergeInfo, setMergeInfo] = useState<MergeInfo | null>(null);

  //[HttpGet("repository/{owner}/{repo}/{branch}/protection/{prnumber}")]
  useEffect(() => {
    const fetchMergeInfo = async (branch: string) => {
      try {
        const apiUrl = `${BASE_URL}/api/github/repository/${owner}/${repoName}/${branch}/protection/${prNumber}`;
        const res = await axios.get(apiUrl, {
          withCredentials: true,
        });
        if (res) {
          setMergeInfo(res.data);
          console.log("protection", res.data);
        }
      } catch (error) {
        console.error("Error fetching merge info:", error);
      }
    };
    if (pullRequestDetails) fetchMergeInfo(pullRequestDetails.baseRefName);
  }, [owner, prNumber, repoName, pullRequestDetails]);

  if (isLoadingPullRequestData)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  if (pullRequestDetails === undefined)
    return (
      <Center>
        <Text>Something went wrong, pull request was not found?</Text>
      </Center>
    );

  return (
    <div style={{ textAlign: "left", marginLeft: 100 }}>
      <Group>
        <Anchor component="a" href={pullRequestDetails.pullRequestUrl} target="_blank" underline="never">
          <h2>
            {" "}
            {pullRequestDetails.title ?? "Loading"}
            <span style={{ color: "#778DA9" }}> #{prNumber}</span>
          </h2>
        </Anchor>
        &ensp;&ensp;
        <Badge
          size="lg"
          color={pullRequestDetails.merged ? "#9539CA" : pullRequestDetails.closedAt !== null ? "red" : "green"}
          key={1}
          rightSection={
            pullRequestDetails.merged ? mergeIcon : pullRequestDetails.closedAt !== null ? closeIcon : openIcon
          }
        >
          {pullRequestDetails.merged ? "Merged" : pullRequestDetails.closedAt !== null ? "Closed" : "Open"}
        </Badge>
      </Group>
      <Group mb="sm">
        <span style={{ color: "#778DA9" }}>Last updated </span>
        <Group>
          {" "}
          {new Date(pullRequestDetails.updatedAt).toDateString()}
          <span style={{ color: "#778DA9" }}>by </span>
          <Group>
            <UnstyledButton component="a" href={pullRequestDetails.author.url} target="_blank" c="blue">
              {pullRequestDetails.author.login}
            </UnstyledButton>
          </Group>
        </Group>
        <span style={{ color: "#778DA9" }}> at project</span>
        <UnstyledButton component="a" href={pullRequestDetails.repositoryUrl} target="_blank" c="blue">
          {repoName}
        </UnstyledButton>
      </Group>
      <Box w="50%">
        <PRSummaryBox
          numFiles={pullRequestDetails.changedFiles.fileCount ?? 0}
          numCommits={pullRequestDetails.commitCount ?? 0}
          addedLines={pullRequestDetails.changedFiles.lineAdditions ?? 0}
          deletedLines={pullRequestDetails.changedFiles.lineDeletions ?? 0}
        />
      </Box>

      <Box>
        <br />
        <TabComp tabs={tabs} currentTab={currentTab} />
        <br />
        <Box>
          {currentTab === "reviews" && <ModifiedFilesTab />}
          {currentTab === "comments" && <CommentsTab pullRequestDetails={pullRequestDetails} mergeInfo={mergeInfo} />}
          {currentTab === "summary" && <PrDetailTab pullRequestDetails={pullRequestDetails} />}
          {currentTab === "commits" && <CommitsTab />}
        </Box>
      </Box>
    </div>
  );
}

export default PRDetailsPage;
