import { Badge, Box, rem, Text, Card, Group, Anchor, Title, Loader, Center, Button, Flex } from "@mantine/core";
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
  const checkSuites = pullRequestDetails.checkSuites.filter(
    (cs) => cs.workflowRun !== null && cs.conclusion === APICheckConclusionState.SUCCESS,
  );
  const totalCheckRuns: number = checkSuites.reduce((total, checksuite) => {
    const checkrunsLength: number = checksuite.workflowRun?.checkRuns.length ?? 0;
    return total + checkrunsLength;
  }, 0);
  const totalSuccesfullCheckRuns: number = checkSuites.reduce((total, checksuite) => {
    const checkrunsLength: number =
      checksuite.workflowRun?.checkRuns.filter((cr) => cr.conclusion == APICheckConclusionState.SUCCESS).length ?? 0;
    return total + checkrunsLength;
  }, 0);
  //http get pullrequest/{owner}/{repoName}/{prnumber}/summary
  const { owner, repoName, prnumber } = useParams();
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function regenerate() {
    setIsLoading(true);
    let diff = "" ;

    //get diff
    const fetchDiffFile= async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/github/pullrequests/${owner}/${repoName}/${prnumber}/files`,
          {
            withCredentials: true,
          },
        );
        if (res) {
          diff = res.data[0].content;
          console.log(diff)
          setAiSummary(diff);
        }
      } catch (error) {
        console.error("Error fetching ai summary:", error);
      }
    };

    fetchDiffFile();





    const fetchData = async () => {
      try {
        const res = await axios.get(
          `https://u2zgscvzzf.execute-api.us-west-1.amazonaws.com/Test?prompt=${"generate summary for this code change:" + diff}`,
        );
        if (res) {
          setAiSummary(res.data.body);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching ai summary:", error);
      }
    };


    fetchData().then();
  }

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
        Checks ( {totalSuccesfullCheckRuns} / {totalCheckRuns} )
      </Badge>
      <Box display="flex" style={{ flexWrap: "wrap" }}>
        {checkSuites.map((checkSuite) =>
          checkSuite.workflowRun?.checkRuns.map((checkRuns) => (
            <Card
              key={checkRuns.name}
              shadow="sm"
              component="a"
              padding="sm"
              href={checkRuns.permalink}
              target="_blank"
              withBorder
              w="30%"
              style={{ marginBottom: "20px", marginRight: "20px" }}
            >
              <Group>
                <Text fw={500} size="lg" mt="md" style={{ marginBottom: "10px" }}>
                  {checkRuns.name}
                </Text>

                <Text fw={500} size="lg" mt="md">
                  {checkRuns.conclusion === APICheckConclusionState.SUCCESS && (
                    <IconCircleCheck
                      color="green"
                      style={{ width: rem(22), height: rem(22), color: "green", marginLeft: "auto" }}
                    />
                  )}
                  {checkRuns.conclusion === APICheckConclusionState.FAILURE && (
                    <IconXboxX
                      color="red"
                      style={{ width: rem(22), height: rem(22), color: "red", marginLeft: "auto" }}
                    />
                  )}
                </Text>

                <Anchor
                  href={checkRuns.permalink}
                  target="_blank"
                  c="blue"
                  style={{ position: "absolute", right: "15px", display: "flex" }}
                >
                  Details
                </Anchor>
              </Group>
            </Card>
          )),
        )}
      </Box>
      <br></br>
      <Box style={{ border: "1px solid cyan", borderRadius: "10px" }} p="md" w="80%">
        <Flex justify="space-between">
          <Group>
            <IconSparkles color="cyan" style={{ width: rem(25), height: rem(25) }} />
            <Title c="cyan" order={4}>
              AI Summary of PR
            </Title>
          </Group>
          <Button onClick={regenerate}>Regenerate</Button>
        </Flex>
        {isLoading && (
          <Center>
            <Loader color="blue" m="md" />
          </Center>
        )}
        {!isLoading && (
          <div>
            <Markdown>{aiSummary}</Markdown>
          </div>
        )}
      </Box>
    </Box>
  );
}
