import UserLogo from "../assets/icons/user.png";
import GitHubLogo from "../assets/icons/github-mark-white.png";
import { Grid, Box, Flex } from "@mantine/core";
import classes from "../styles/PRList.module.css";
import LabelButton from "./LabelButton";
import { Link } from "react-router-dom";

interface PRBoxProps {
  id: number;
  prName: string;
  repository: string;
  dateCreated: string;
  labels: string[];
}

function PRBox({ id, prName, repository, dateCreated, labels }: PRBoxProps) {
  return (
    <Grid m={5} p={5}>
      <Grid.Col span={7}>
        <Flex justify={"flex-start"}>
          <Box fw={200} mr={"10px"} ml={"10px"}>
            {id}
          </Box>
          <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
          <Link to={"pulls/" + id}>
            <Box className={classes.bold}>{prName}</Box>
          </Link>
          <Box className={classes.light}>at {}</Box>
          {repository}
          <Box className={classes.light}>created :{dateCreated}</Box>
        </Flex>
      </Grid.Col>
      <Grid.Col span={4}>
        <Flex justify={"end"}>
          {labels.map((label) => (
            <LabelButton key={label} label={label} size={"md"} />
          ))}
        </Flex>
      </Grid.Col>
      <Grid.Col span={1}>
        <Box component="img" src={GitHubLogo} alt={"icon"} className={classes.logo} />
      </Grid.Col>
    </Grid>
  );
}

export default PRBox;
