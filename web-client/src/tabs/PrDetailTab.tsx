import { Badge, Box, rem, Text, Card, Group, Anchor } from "@mantine/core";
import { IconCheckupList } from "@tabler/icons-react";
import { IconCircleCheck, IconXboxX } from "@tabler/icons-react";

import { APICheckConclusionState, APIPullRequestDetails } from "../api/types.ts";

export interface PRDetailTabProps {
  pullRequestDetails: APIPullRequestDetails;
}

export default function PrDetailTab({ pullRequestDetails }: PRDetailTabProps) {
  const iconCheckupList = <IconCheckupList style={{ width: rem(27), height: rem(27) }} />;

  const checkSuites = pullRequestDetails.checkSuites;

  return (
    <Box>
      <Badge leftSection={iconCheckupList} size="lg" mb={10} variant="gradient" style={{ visibility: "visible" }}>
        Checks ( {checkSuites.filter(cs => cs.conclusion === APICheckConclusionState.SUCCESS).length} / {checkSuites.length} )
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
                {
                  checkSuite.id // FIXME: should be name, not id
                }
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
    </Box>
  );
}
