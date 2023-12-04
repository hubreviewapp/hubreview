import UserLogo from "../assets/icons/user.png";
import GitHubLogo from "../assets/icons/github-logo.png";
import { Grid, Box , Flex, Badge} from '@mantine/core';
import {border, borderRadius} from "@mui/system";



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
    <Grid style={{border: "solid 1px #BCBCBC", borderRadius:"10px",
      "&:hover": {borderColor: "rgba(188,188,188,0.69)", cursor: "pointer"}}} m={5} p={5}>
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
          <Badge
            size="lg"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            key={1}
            m={3}>
            {label}
          </Badge>
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
