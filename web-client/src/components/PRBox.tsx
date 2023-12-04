import UserLogo from "../assets/icons/user.png";
import GitHubLogo from "../assets/icons/github-logo.png";
import { Grid, Box , Flex} from '@mantine/core';
import classes from "../styles/PRBox.module.css";
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
          <Box className={"bold"}>{id}</Box>
          <Box component="img" src={UserLogo} alt={"logo"} w={30} />
          <Box className={"bold"}>{prName}</Box>
          <Box className={"light"}>at {}</Box>
          {repository}
          <Box className={"light"}>created :{dateCreated}</Box>
        </Flex>

      </Grid.Col>
      <Grid.Col span={4}>
        <Flex justify={"end"}>
        {labels.map((label) => (
            <LabelButton key={1} label={label} size={"lg"}/>
        ))}
        </Flex>
      </Grid.Col>
      <Grid.Col span={1}>
        <Box component="img" src={GitHubLogo} alt={"icon"} c={"red"} w={30} style={{borderRadius:"15px", backgroundColor:"#bebebe"}}/>
      </Grid.Col>
    </Grid>
  );
}

export default PRBox;
