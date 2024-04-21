import {Badge, Box, rem, Text, Card, Group, Anchor, Title, Loader, Center, Button, Flex} from "@mantine/core";
import { IconCheckupList, IconSparkles } from "@tabler/icons-react";
import { IconCircleCheck, IconXboxX } from "@tabler/icons-react";

import { PRDetail } from "../pages/PRDetailsPage.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../env.ts";
import Markdown from "react-markdown";

export interface PRDetailTabProps {
  pull: PRDetail;
}

export default function PrDetailTab({ pull }: PRDetailTabProps) {
  const iconCheckupList = <IconCheckupList style={{ width: rem(27), height: rem(27) }} />;
  const checks = pull.checks;

  //http get pullrequest/{owner}/{repoName}/{prnumber}/summary
  const { owner, repoName, prnumber } = useParams();
  const [aiSummary, setAiSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function regenerate() {

    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/pullrequest/${owner}/${repoName}/${prnumber}/summary?regen=true`, {
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
  }, []); // eslint-disable-line

  return (
    <Box>
      <Badge leftSection={iconCheckupList} size="lg" mb={10} variant="gradient" style={{ visibility: "visible" }}>
        Checks ( {pull.checksSuccess} / {pull.checks.length} )
      </Badge>
      <Box display="flex" style={{ flexWrap: "wrap" }}>
        {checks.map((check) => (
          <Card
            key={check.id}
            shadow="sm"
            component="a"
            padding="sm"
            href={check?.url}
            target="_blank"
            withBorder
            w="30%"
            style={{ marginBottom: "20px", marginRight: "20px" }}
          >
            <Group>
              <Text fw={500} size="lg" mt="md" style={{ marginBottom: "10px" }}>
                {check.name}
              </Text>

              <Text fw={500} size="lg" mt="md">
                {check.conclusion?.StringValue === "success" && (
                  <IconCircleCheck
                    color="green"
                    style={{ width: rem(22), height: rem(22), color: "green", marginLeft: "auto" }}
                  />
                )}
                {check.conclusion?.StringValue === "failure" && (
                  <IconXboxX
                    color="red"
                    style={{ width: rem(22), height: rem(22), color: "red", marginLeft: "auto" }}
                  />
                )}
              </Text>

              <Anchor
                href={check?.url}
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
        <Flex justify={"space-between"}>
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
        {!isLoading &&
          <div>
            <Markdown>{aiSummary}</Markdown>
          </div>
        }
      </Box>
    </Box>
  );
}
