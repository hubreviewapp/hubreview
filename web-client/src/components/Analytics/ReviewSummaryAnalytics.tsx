import { Flex, Text, Paper, rem, Title } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconSend, IconMailbox, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axios from "axios";

//user/weeklysummary
function ReviewSummaryAnalytics() {
  const [userData, setData] = useState([
    { name: "Submitted Reviews", value: 0, color: "indigo.6" },
    { name: "Received Reviews", value: 0, color: "yellow.6" },
    { name: "Waiting for Review", value: 0, color: "red.6" },
  ]);

  useEffect(() => {
    const fetchOpenPRs = async () => {
      try {
        const res = await axios.get(`http://localhost:5018/api/github/user/weeklysummary`, {
          withCredentials: true,
        });
        if (res) {
          setData(
            userData.map((item, index) => ({
              ...item,
              value: res.data[index],
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching PR info:", error);
      }
    };

    fetchOpenPRs().then();
  }, []); // eslint-disable-line

  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Weekly Review Summary
      </Title>

      <Flex justify="space-around">
        <Text>
          <IconSend style={{ width: rem(18), height: rem(18) }} />
          Submitted: {userData[0].value}
        </Text>
        <Text>
          <IconMailbox style={{ width: rem(18), height: rem(18) }} />
          Received: {userData[1].value}{" "}
        </Text>
        <Text>
          <IconClock style={{ width: rem(18), height: rem(18) }} />
          Waiting: {userData[2].value}{" "}
        </Text>
      </Flex>
      <DonutChart mt="md" data={userData} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default ReviewSummaryAnalytics;
