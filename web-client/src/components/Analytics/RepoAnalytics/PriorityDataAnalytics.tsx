import { Flex, Paper, Text, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";

function PriorityDataAnalytics() {
  const data = [
    { name: "Critical", value: 5, color: "red.6" },
    { name: "High", value: 2, color: "orange.6" },
    { name: "Medium", value: 3, color: "yellow.6" },
    { name: "Low", value: 4, color: "green.6" },
  ];
  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Priority Distribution of PRs
      </Title>
      <Flex justify="center">
        {data.map((itm) => (
          <Text c="dimmed" key={itm.name} mr="sm">
            {itm.name}:{itm.value}
          </Text>
        ))}
      </Flex>
      <DonutChart mt="md" data={data} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default PriorityDataAnalytics;
