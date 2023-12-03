import prsData from "../pr_data.json";
import {Box, Button, Pagination} from "@mui/material";
import "../styles/common.css";
import { Link } from "react-router-dom";
import PRBox from "../components/PRBox";


function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];

  return (
    <Box height={800} p={0} m={0} width="100%" display="flex" flexDirection={"column"}
         justifyContent={"center"} alignItems={"center"} sx={{ backgroundColor: "#1B263B" }}>

        <Box p={5} display="flex" flexDirection="column" width="90%">
          {prsData.map((item) => (
            <PRBox key={item.id} id={item.id} repository={item.repository} prName={item.prName} labels={item.labels} dateCreated={item.dateCreated}/>
          ))}
        </Box>

      <Box m={3}>
        <Pagination count={10} color="primary" shape={"rounded"} />
      </Box>
      <Box m={3}>
        <Link to={"/createPR"}>
          <Button variant="contained">Create New PR</Button>
        </Link>
      </Box>
    </Box>
  );
}

export default PRList;
