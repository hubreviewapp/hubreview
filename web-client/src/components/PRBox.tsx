import UserLogo from "../assets/icons/user.png";
import GitHubLogo from "../assets/icons/github-icon-white.png";
import { Grid, Box , Flex} from '@mantine/core';
import classes from "../styles/PRList.module.css";
import LabelButton from "./LabelButton";

interface PRBoxProps {
  id: number;
  prName: string;
  repository: string;
  dateCreated: string;
  labels: [];
}


function PRBox({ id,
                 prName,
                 repository,
                 dateCreated,
                 labels}: PRBoxProps) {
  return(
    <Grid className={classes.outlinedBox} m={5} p={5}>
      <Grid.Col span={7}>
        <Flex justify={"flex-start"}>
          <Box fw={200} mr={"10px"} ml={"10px"}>{id}</Box>
          <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
          <Box className={classes.bold}>{prName}</Box>
          <Box className={classes.light}>at {}</Box>
          {repository}
          <Box className={classes.light}>created :{dateCreated}</Box>
        </Flex>

      </Grid.Col>
      <Grid.Col span={4}>
        <Flex justify={"end"}>
        {labels.map((label) => (
            <LabelButton key={label} label={label} size={"md"}/>
        ))}
        </Flex>
      </Grid.Col>
      <Grid.Col span={1}>
        <Box component="img" src={GitHubLogo} alt={"icon"}  />
      </Grid.Col>
    </Grid>
  );
}

export default PRBox;
