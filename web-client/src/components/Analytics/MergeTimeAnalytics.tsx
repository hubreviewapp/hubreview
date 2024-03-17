import { LineChart } from "@mantine/charts";
import { Box, Text, Paper } from "@mantine/core";

const data = [
  {
    date: "Mar 22",
    value: 5,
  },
  {
    date: "Mar 23",
    value: 2,
  },
  {
    date: "Mar 24",
    value: 6,
  },
  {
    date: "Mar 25",
    value: 7,
  },
  {
    date: "Mar 26",
    value: 6,
  },
];

function MergeTimeAnalytics() {
  return (
    <Box>
      <Text mb="sm">Average Merge Time of PRs</Text>
      <Paper withBorder p="md">
        <LineChart
          h={300}
          data={data}
          dataKey="date"
          series={[{ name: "value", color: "indigo.6" }]}
          curveType="linear"
          tickLine="x"
          gridAxis="xy"
          unit=" days"
        />
      </Paper>
    </Box>
  );
}

// noinspection JSUnusedGlobalSymbols
export default MergeTimeAnalytics;
