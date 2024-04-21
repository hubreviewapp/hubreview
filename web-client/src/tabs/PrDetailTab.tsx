import { Badge, Box, rem, Text, Card, Group, Anchor, Title, Loader, Center } from "@mantine/core";
import { IconCheckupList, IconSparkles } from "@tabler/icons-react";
import { IconCircleCheck, IconXboxX } from "@tabler/icons-react";

import { APICheckConclusionState, APIPullRequestDetails } from "../api/types.ts";

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../env.ts";
import Markdown from "react-markdown";

const iconCheckupList = <IconCheckupList style={{ width: rem(27), height: rem(27) }} />;

export interface PRDetailTabProps {
  pullRequestDetails: APIPullRequestDetails;
}

export default function PrDetailTab({ pullRequestDetails }: PRDetailTabProps) {
  const checkSuites = pullRequestDetails.checkSuites.filter((cs) => cs.workflowRun !== null);

  //http get pullrequest/{owner}/{repoName}/{prnumber}/summary
  const { owner, repoName, prnumber } = useParams();
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/summary`, {
          withCredentials: true,
        });
        if (res) {
          setAiSummary(res.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching ai summary:", error);
      }
    };

    fetchData().then();
  }, [owner, repoName, prnumber, setAiSummary, setIsLoading]);

  return (
    <Box>
      <Badge leftSection={iconCheckupList} size="lg" mb={10} variant="gradient" style={{ visibility: "visible" }}>
        Checks ( {checkSuites.filter((cs) => cs.conclusion === APICheckConclusionState.SUCCESS).length} /{" "}
        {checkSuites.length} )
      </Badge>
      <Box display="flex" style={{ flexWrap: "wrap" }}>
        {checkSuites.map((checkSuite) => (
          <Card
            key={checkSuite.id}
            shadow="sm"
            component="a"
            padding="sm"
            href={checkSuite.workflowRun?.url}
            target="_blank"
            withBorder
            w="30%"
            style={{ marginBottom: "20px", marginRight: "20px" }}
          >
            <Group>
              <Text fw={500} size="lg" mt="md" style={{ marginBottom: "10px" }}>
                {checkSuite.workflowRun?.workflow.name}
              </Text>

              <Text fw={500} size="lg" mt="md">
                {checkSuite.conclusion === APICheckConclusionState.SUCCESS && (
                  <IconCircleCheck
                    color="green"
                    style={{ width: rem(22), height: rem(22), color: "green", marginLeft: "auto" }}
                  />
                )}
                {checkSuite.conclusion === APICheckConclusionState.FAILURE && (
                  <IconXboxX
                    color="red"
                    style={{ width: rem(22), height: rem(22), color: "red", marginLeft: "auto" }}
                  />
                )}
              </Text>

              <Anchor
                href={checkSuite.workflowRun?.url}
                target="_blank"
                c="blue"
                style={{ position: "absolute", right: "15px", display: "flex" }}
              >
                Details
              </Anchor>
            </Group>
          </Card>
        ))}
      </Box>
      <br></br>
      <Box style={{ border: "1px solid cyan", borderRadius: "10px" }} p="md" w="80%">
        <Group>
          <IconSparkles color="cyan" style={{ width: rem(25), height: rem(25) }} />
          <Title c="cyan" order={4}>
            AI Summary of PR
          </Title>
        </Group>
        {isLoading && (
          <Center>
            <Loader color="blue" m="md" />
          </Center>
        )}
        {!isLoading && <Markdown>{aiSummary}</Markdown>}
      </Box>
    </Box>
  );
}
