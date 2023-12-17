import { Button, Paper, Box, rem, Text, Tooltip, Badge, Table, Stack } from "@mantine/core";
import { IconCheck, IconInfoCircle, IconX, IconClock } from "@tabler/icons-react";
import { Link } from "react-router-dom";

function calculatePercentage(n1: number, n2: number) {
  return Math.floor((n1 / (n1 + n2)) * 100);
}

function ApprovalRejectionRates() {
  const users = [
    {
      id: 1,
      username: "ayse_kelleci",
      approval: 30,
      rejection: 20,
      waiting: 10,
    },
    {
      id: 2,
      username: "irem_Aydin",
      approval: 20,
      rejection: 10,
      waiting: 7,
    },
    {
      id: 3,
      username: "alper_mum",
      approval: 25,
      rejection: 14,
      waiting: 6,
    },
  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
  const rows = users.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td>{element.username}</Table.Td>
      <Table.Td>
        <Text color={"green"}>
          <IconCheck color={"green"} style={{ width: rem(18), height: rem(18) }} />
          {element.approval}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color={"red"}>
          <IconX color={"red"} style={{ width: rem(18), height: rem(18) }} />
          {element.rejection}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color={"#808080"}>
          <IconClock color={"gray"} style={{ width: rem(18), height: rem(18) }} />
          {element.waiting}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color={"green"}>{calculatePercentage(element.approval, element.rejection)} %</Text>
      </Table.Td>
      <Table.Td>
        <Text color={"red"}>{calculatePercentage(element.rejection, element.approval)} %</Text>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Box w={"550px"}>
      <Paper shadow="xl" radius="md" p="sm" mt={"lg"} withBorder>
        <Stack align="center">
          <Text fw={500} size={"lg"} mb={"sm"}>
            Approval/Rejection Rates for Author
            <Tooltip label={"Approval/Rejection rates of PRs for authors"}>
              <Badge leftSection={iconInfo} variant={"transparent"} />
            </Tooltip>
          </Text>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Authors</Table.Th>
                <Table.Th>Approvals</Table.Th>
                <Table.Th>Rejections</Table.Th>
                <Table.Th>Waiting</Table.Th>
                <Table.Th>Approval Rate</Table.Th>
                <Table.Th>Rejection Rate</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
          <Button w={"100px"} component={Link} to="../analytics/author/rates">
            See More
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ApprovalRejectionRates;
