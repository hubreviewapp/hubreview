import {Table, Box, Text, rem, Container} from "@mantine/core";
import { useEffect, useState } from "react";
import { NativeSelect } from "@mantine/core";
import { IconCheck, IconX, IconClock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export default function ApprRejRatesForAuthorPage() {
  const sort: string[] = ["Most approved", "Least approved", "Most rejected", "Least rejected"];
  const repos: string[] = ["All", "ReLink", "Eventium"];
  const authors: string[] = ["All", "Ece-Kahraman", "Ayse-Kelleci", "Alper-Mumcular", "Irem-Aydın", "Vedat-Arıcan"];
  const timeline: string[] = ["All", "Last week", "Last 2 weeks", "Last month", "Last 3 months"];

  const [sortValue, setSortValue] = useState("Least rejected");
  const [filteredRepo, setFilteredRepo] = useState("All");
  const [filteredAuthor, setFilteredAuthor] = useState("All");
  const [filteredTimeline, setFilteredTimeline] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {    
  if ( localStorage.getItem("userLogin") === null ){
    navigate("/signIn");
  }
  }, [navigate]);

  const elements = [
    { author: "aysekelleci", approves: 10, rejects: 4, waiting: 7 },
    { author: "iremaydın", approves: 20, rejects: 5, waiting: 12 },
    { author: "ecekahraman", approves: 18, rejects: 6, waiting: 2 },
    { author: "alpermumcular", approves: 18, rejects: 12, waiting: 12 },
    { author: "vedatarican", approves: 15, rejects: 5, waiting: 3 },
  ];

  const rows = elements.map((element) => (
    <Table.Tr key={element.author}>
      <Table.Td>{element.author}</Table.Td>
      <Table.Td>
        <Text color="green">
          <IconCheck color="green" style={{ width: rem(18), height: rem(18) }} />
          {element.approves}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="red">
          <IconX color="red" style={{ width: rem(18), height: rem(18) }} />
          {element.rejects}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="#808080">
          <IconClock color="gray" style={{ width: rem(18), height: rem(18) }} />
          {element.waiting}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text color="green">{Math.round((100 * element.approves) / (element.rejects + element.approves))}%</Text>
      </Table.Td>
      <Table.Td>
        <Text color="red">{Math.round((element.rejects / (element.rejects + element.approves)) * 100)}%</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box style={{ padding: "40px" }}>
      <Container>
      <Text size="xl"> Approve Rejection Rates for Author </Text>
      <br />
      <Box display="flex">
        <NativeSelect
          description="Sort"
          value={sortValue}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSortValue(event.currentTarget.value)}
          data={sort}
        />{" "}
        &ensp;
        <NativeSelect
          description="Select Author"
          value={filteredAuthor}
          onChange={(event) => setFilteredAuthor(event.currentTarget.value)}
          data={authors}
        />{" "}
        &ensp;
        <NativeSelect
          description="Select Repo"
          value={filteredRepo}
          onChange={(event) => setFilteredRepo(event.currentTarget.value)}
          data={repos}
        />{" "}
        &ensp;
        <NativeSelect
          description="Select Timeline"
          value={filteredTimeline}
          onChange={(event) => setFilteredTimeline(event.currentTarget.value)}
          data={timeline}
        />{" "}
        &ensp;
      </Box>
      <Table mt="md" striped highlightOnHover >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Author</Table.Th>
            <Table.Th>Approvals</Table.Th>
            <Table.Th>Rejections</Table.Th>
            <Table.Th>Waiting</Table.Th>
            <Table.Th>Approval Rate</Table.Th>
            <Table.Th>Rejection Rate</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      </Container>
    </Box>
  );
}
