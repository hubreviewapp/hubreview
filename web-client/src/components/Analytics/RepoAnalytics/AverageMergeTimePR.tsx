import { Paper, Title } from "@mantine/core";
import { AreaChart } from "@mantine/charts";

const data = [
  { date: "1 May", duration: 2 },
  { date: "8 May", duration: 4 },
  { date: "15 May", duration: 3 },
];

function AverageMergeTimePR() {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Average Merge Times of PRs
      </Title>
      <AreaChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "duration", color: "blue.6" }]}
        unit=" days"
        curveType="linear"
      />
    </Paper>
  );
}

export default AverageMergeTimePR;
