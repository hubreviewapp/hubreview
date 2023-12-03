import prsData from "../pr_data.json";
import { Box, Button, Container } from "@mui/material";
import "../styles/common.css";
import { Link } from "react-router-dom";
import PRBox from "../components/PRBox";


function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];

  return (
    <Box height={700} p={0} m={0} width="100%" display="flex" flexDirection={"column"}
         justifyContent={"space-evenly"} alignItems={"center"} sx={{ backgroundColor: "#1B263B" }}>
      <Container sx={{ p: 20, m: "auto" }}>
        <Box m="auto" p={5} display="flex" flexDirection="column" width="90%">
          {prsData.map((item) => (
            <PRBox key={item.id} id={item.id} repository={item.repository} prName={item.prName} labels={item.labels} dateCreated={item.dateCreated}/>
          ))}
        </Box>
      </Container>
      <Link to={"/createPR"}>
        <Button variant="contained">Create New PR</Button>
      </Link>
    </Box>
  );
}

export default PRList;
