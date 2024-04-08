import { Paper, Title } from "@mantine/core";
import { LineChart } from "@mantine/charts";

const data = [
  { date: "1 May", duration: 2 },
  { date: "8 May", duration: 4 },
  { date: "15 May", duration: 3 },
];

function TimePRWaitingReview() {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Time PRs Waiting for Review
      </Title>
      <LineChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "duration", color: "green.6" }]}
        curveType="monotone"
        unit=" days"
      />
    </Paper>
  );
}

export default TimePRWaitingReview;
