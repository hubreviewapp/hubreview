import { Flex, Text, Paper, Group, rem, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconSend, IconMailbox, IconClock } from "@tabler/icons-react";

const data = [
  { name: "Submitted Reviews", value: 15, color: "indigo.6" },
  { name: "Received Reviews", value: 11, color: "yellow.6" },
  { name: "Waiting for Review", value: 3, color: "gray.6" },
];
function ReviewSummaryAnalytics() {
  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Weekly Review Summary
      </Title>

      <Flex justify="space-around">
        <Text>
          <IconSend style={{ width: rem(18), height: rem(18) }} />
          Submitted: 15
        </Text>
        <Text>
          <IconMailbox style={{ width: rem(18), height: rem(18) }} />
          Received: 11{" "}
        </Text>
        <Text>
          <IconClock style={{ width: rem(18), height: rem(18) }} />
          Waiting: 3{" "}
        </Text>
      </Flex>
      <DonutChart mt="md" data={data} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default ReviewSummaryAnalytics;
