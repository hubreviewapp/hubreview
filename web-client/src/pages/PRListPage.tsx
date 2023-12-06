import prsData from "../pr_data.json";
import { Link } from "react-router-dom";
import PRBox from "../components/PRBox";
import {useState} from "react";
import {
  Flex,
  Box,
  Button,
  Pagination,
  NativeSelect, Grid, TextInput
} from "@mantine/core";

function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];
  const sort : string[] = ["Priority Queue", "Newest", "Oldest"];
  const repos :string[] = ["All", "ReLink", "Eventium"]
  const authors :string[] = ["All", "Ece-Kahraman", "Ayse-Kelleci"]

  const [sortValue, setSortValue] = useState('Priority Queue');
  const [filteredRepo, setFilteredRepo] = useState("All");
  const [filteredAuthor, setFilteredAuthor] = useState("All");

  return (
    <Flex h={"600px"} p={0} m={0} w="100%" justify="space-evenly"  align={"center"} direction="column" bg = "#1B263B" >
      <Grid w={"70%"}>
        <Grid.Col span={6}>
          <TextInput
            description="Search a PR"
            placeholder="Search"
          />
        </Grid.Col>
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
      </Grid>
        <Flex direction="column"  w="70%" style={sortValue == "Priority Queue" ? {border:"solid 0.5px cyan", borderRadius:"10px"}:{border:"solid 0.5px #415A77", borderRadius:"10px"}}>
          {prsData.map((item) => (
            <PRBox key={item.id} id={item.id} repository={item.repository} prName={item.prName} labels={item.labels} dateCreated={item.dateCreated}/>
          ))}
        </Flex>

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
