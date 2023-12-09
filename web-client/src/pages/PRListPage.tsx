import prsData from "../pr_data.json";
import { Link } from "react-router-dom";
import PRBox from "../components/PRBox";
import { IconSparkles, IconSearch } from '@tabler/icons-react';
import {useState} from "react";
import {
  Flex,
  Box,
  Button,
  Pagination,
  NativeSelect, Grid, TextInput, Badge, rem,
} from "@mantine/core";

function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];
  const sort : string[] = ["Priority Queue", "Newest", "Oldest"];
  const repos :string[] = ["All", "ReLink", "Eventium"]
  const authors :string[] = ["All", "Ece-Kahraman", "Ayse-Kelleci"]

  const [sortValue, setSortValue] = useState('Priority Queue');
  const [filteredRepo, setFilteredRepo] = useState("All");
  const [filteredAuthor, setFilteredAuthor] = useState("All");

  const iconSparkles = <IconSparkles style={{ width: rem(22), height: rem(22) }} />;
  const iconSearch = <IconSearch style={{ width: rem(18), height: rem(18) }} />;


  return (
    <Flex h={"550px"} p={0} m={0} w="100%" justify="space-evenly"  align={"center"} direction="column" bg = "#1B263B" >

      <Grid w={"70%"}>
        <Grid.Col span={2}>
          <NativeSelect
            description="Sort"
            value={sortValue}
            onChange={(event) => setSortValue(event.currentTarget.value)}
            data={sort}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <NativeSelect
            description="Select Repo"
            value={filteredRepo}
            onChange={(event) => setFilteredRepo(event.currentTarget.value)}
            data={repos}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <NativeSelect
            description="Select Author"
            value={filteredAuthor}
            onChange={(event) => setFilteredAuthor(event.currentTarget.value)}
            data={authors}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            leftSection={iconSearch}
            description="Search a PR"
            placeholder="Search"
          />
        </Grid.Col>
      </Grid>
      <Box w={"70%"}>
        <Badge leftSection={iconSparkles} mb={3} variant={"gradient"} style={ {visibility: sortValue == "Priority Queue" ? "visible" : "hidden"}}>Priority Queue</Badge>
        <Flex direction="column" style={sortValue == "Priority Queue" ? {border:"solid 0.5px cyan", borderRadius:"10px"}:{border:"solid 0.5px #415A77", borderRadius:"10px"}}>
          {prsData.map((item) => (
            <PRBox key={item.id} id={item.id} repository={item.repository} prName={item.prName} labels={item.labels} dateCreated={item.dateCreated}/>
          ))}
        </Flex>
      </Box>

      <Box m={3}>
        <Pagination color="primary"  shape={"rounded"}  total={4}/>
      </Box>
      <Box m={3}>
        <Link to={"/createPR"}>
          <Button variant="contained">Create New PR</Button>
        </Link>
      </Box>
    </Flex>
  );
}

export default PRList;
