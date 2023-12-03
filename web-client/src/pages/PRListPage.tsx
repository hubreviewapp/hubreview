import prsData from "../pr_data.json";
import { Box, Button, Container, Grid, SxProps } from "@mui/material";
import GitHubLogo from "../assets/icons/github-logo.png";
import UserLogo from "../assets/icons/user.png";
import "../styles/common.css";
import LabelButton from "../components/LabelButton";
import { Link } from "react-router-dom";

const iconSx: SxProps = {
  width: 30,
  height: 30,
  ml: 10,
  borderRadius: 20,
};

const gridItemSx: SxProps = {
  display: "flex",
};

function PRList() {
  // TODO const prTabs: string[] = ["created", "assigned", "merged"];

  return (
    <Box height={700} p={0} m={0} width="100%" sx={{ backgroundColor: "#1B263B" }}>
      <Container sx={{ p: 20, m: "auto" }}>
        <Box m="auto" p={5} display="flex" flexDirection="column" width="90%">
          {prsData.map((item) => (
            <Grid
              key={item.id}
              container
              m="auto"
              mt={20}
              p={15}
              border="solid 1px #BCBCBC"
              borderRadius={10}
              height={60}
              width="90%"
              display="flex"
              sx={{ "&:hover": { borderColor: "rgba(188,188,188,0.69)", cursor: "pointer" } }}
            >
              <Grid item xs={7} sx={gridItemSx}>
                {item.id}
                <Box component="img" src={UserLogo} alt={"logo"} sx={iconSx} />

                <Box className={"bold"}>{item.prName}</Box>

                <Box className={"light"}>at {}</Box>
                {item.repository}
                <Box className={"light"}>created :{item.dateCreated}</Box>
              </Grid>
              <Grid item xs={4} sx={gridItemSx}>
                {item.labels.map((label) => (
                  <LabelButton key={label} label={label} height={30} width={120} />
                ))}
              </Grid>
              <Grid item xs={1}>
                <Box component="img" src={GitHubLogo} alt={"icon"} sx={iconSx} />
              </Grid>
            </Grid>
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
