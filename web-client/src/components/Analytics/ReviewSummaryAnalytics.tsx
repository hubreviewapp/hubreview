import { Flex, Text, Paper, rem, Title, Center, Space } from "@mantine/core";
import { DonutChart } from "@mantine/charts";
import { IconSend, IconMailbox, IconClock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../env";

function ReviewSummaryAnalytics() {
  const [userData, setData] = useState([
    { name: "Submitted Reviews", value: 0, color: "indigo.6" },
    { name: "Received Reviews", value: 0, color: "yellow.6" },
    { name: "Waiting for Review", value: 0, color: "teal.6" },
  ]);

  useEffect(() => {
    const fetchWeeklySummary = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/github/user/weeklysummary`, {
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

    fetchWeeklySummary().then();
  }, []); // eslint-disable-line

  return (
    <Paper ta="center" p="md">
      <Title order={4} mb="sm">
        Weekly Review Summary
      </Title>
      <Flex justify="center" direction="column">
        <Center>
          <IconSend style={{ width: rem(18), height: rem(18) }} />
          Sent: {userData[0].value}
          <Space w="md" />
          <Text fs="italic" c="dimmed">
            ~reviews sent to PRs
          </Text>
        </Center>
        <Center>
          <IconMailbox style={{ width: rem(18), height: rem(18) }} />
          Received: {userData[1].value}
          <Space w="md" />
          <Text fs="italic" c="dimmed">
            ~reviews received this week
          </Text>
        </Center>
        <Center>
          <IconClock style={{ width: rem(18), height: rem(18) }} />
          Waiting: {userData[2].value}
          <Space w="md" />
          <Text fs="italic" c="dimmed">
            ~Prs waiting for your review
          </Text>
        </Center>
      </Flex>
      <DonutChart mt="md" data={userData} tooltipDataSource="segment" mx="auto" />
    </Paper>
  );
}

export default ReviewSummaryAnalytics;
