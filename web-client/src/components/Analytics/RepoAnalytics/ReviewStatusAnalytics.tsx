import { BarChart } from "@mantine/charts";
import { Paper, Title } from "@mantine/core";

const data = [
  { date: "1 May", commented: 2, pending: 3, approved: 1, changeRequested: 4 },
  { date: "3 May", commented: 3, pending: 3, approved: 4, changeRequested: 1 },
  { date: "5 May", commented: 4, pending: 1, approved: 4, changeRequested: 2 },
];
function ReviewStatusAnalytics() {
  return (
    <Paper p="md" ta="center">
      <Title order={4} mb="sm">
        Review Status of PRs
      </Title>
      <BarChart
        h={300}
        data={data}
        dataKey="date"
        series={[
          { name: "commented", color: "violet.6" },
          { name: "pending", color: "blue.6" },
          { name: "approved", color: "teal.6" },
          { name: "change Requested", color: "pink.6" },
        ]}
        tickLine="y"
      />
    </Paper>
  );
}

export default ReviewStatusAnalytics;
