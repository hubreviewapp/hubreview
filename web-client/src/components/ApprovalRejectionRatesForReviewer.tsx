import { Button, Paper, Box, rem, Text, Tooltip, Badge, Table, Stack } from "@mantine/core";
import { IconCheck, IconInfoCircle, IconX, IconClock } from "@tabler/icons-react";
import { Link } from "react-router-dom";


function calculatePercentage(n1: number, n2: number) {
  return Math.floor((n1 / (n1 + n2)) * 100);
}

function ApprovalRejectionRatesReviewer() {
  const users = [
    {
      id: 1,
      username: "ece_kahraman",
      approval: 42,
      rejection: 18,
      waiting: 8,
    },
    {
      id: 2,
      username: "vedat_arican",
      approval: 30,
      rejection: 2,
      waiting: 15,
    },
    {
      id: 3,
      username: "irem_aydın",
      approval: 20,
      rejection: 18,
      waiting: 5,
    },
  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }} />;
  const rows = users.map((element) => (
    <Table.Tr key={element.id}>
      <Table.Td>{element.username}</Table.Td>
      <Table.Td>
        <Text color="green">
          <IconCheck color="green" style={{ width: rem(18), height: rem(18) }} />
          {element.approval}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="red">
          <IconX color="red" style={{ width: rem(18), height: rem(18) }} />
          {element.rejection}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="#808080">
          <IconClock color="gray" style={{ width: rem(18), height: rem(18) }} />
          {element.waiting}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="green">{calculatePercentage(element.approval, element.rejection)} %</Text>
      </Table.Td>
      <Table.Td>
        <Text color="red">{calculatePercentage(element.rejection, element.approval)} %</Text>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Box w="580px">
      <Paper shadow="xl" radius="md" p="sm" mt="lg" withBorder>
        <Stack align="center">
          <Text fw={500} size="lg" mb="sm">
            Approval/Rejection Rates for Reviewer
            <Tooltip label="Approval/Rejection rates of PRs for reviewers">
              <Badge leftSection={iconInfo} variant="transparent" />
            </Tooltip>
          </Text>
          <Table style={{fontSize:"13px"}}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th >Authors</Table.Th>
                <Table.Th>Approvals</Table.Th>
                <Table.Th>Rejections</Table.Th>
                <Table.Th>Waiting</Table.Th>
                <Table.Th>Approval Rate</Table.Th>
                <Table.Th>Rejection Rate</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
          <Button w="100px" component={Link} to="../analytics/author/rates">
            See More
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ApprovalRejectionRatesReviewer;
