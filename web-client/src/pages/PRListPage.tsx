import prsData from "../pr_data.json";
import {Flex, Box, Button, Pagination} from "@mantine/core";
import "../styles/common.css";
import { Link } from "react-router-dom";
import PRBox from "../components/PRBox";


function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];

  return (
    <Flex h={"600px"} p={0} m={0} w="100%" justify="space-evenly"  align={"center"} direction="column" bg ="#1B263B" >

        <Flex direction="column" w="70%">
          {prsData.map((item) => (
            <PRBox key={item.id} id={item.id} repository={item.repository} prName={item.prName} labels={item.labels} dateCreated={item.dateCreated}/>
          ))}
        </Flex>

      <Box m={3}>
        <Pagination color="primary" shape={"rounded"}  total={10}/>
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
