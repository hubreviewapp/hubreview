import {Box, Grid, SxProps} from "@mui/material";
import UserLogo from "../assets/icons/user.png";
import LabelButton from "./LabelButton";
import GitHubLogo from "../assets/icons/github-logo.png";



interface PRBoxProps {
  id: number;
  prName: string;
  repository: string;
  dateCreated: string;
  labels: [];
}
const gridItemSx: SxProps = {
  display: "flex",
};

const iconSx: SxProps = {
  width: 30,
  height: 30,
  ml: 1,
  mt : -0.5,
  borderRadius: 20,
};

function PRBox({ id,
                 prName,
                 repository,
                 dateCreated,
                 labels}: PRBoxProps) {
  return(
    <Grid
      key={id}
      container
      m="auto"
      mt={3}
      p = {3}
      border="solid 1px #BCBCBC"
      borderRadius={10}
      style={{ height: '70px' }}
      width="90%"
      display="flex"
      sx={{ "&:hover": { borderColor: "rgba(188,188,188,0.69)", cursor: "pointer" } }}
    >
      <Grid item xs={8} sx={gridItemSx}>

        <Box className={"bold"}>{id}</Box>

        <Box component="img" src={UserLogo} alt={"logo"} sx={iconSx} />

        <Box className={"bold"}>{prName}</Box>

        <Box className={"light"}>at {}</Box>
        {repository}
        <Box className={"light"}>created :{dateCreated}</Box>
      </Grid>
      <Grid item xs={3} sx={gridItemSx}>
        {labels.map((label) => (
          <LabelButton key={label} label={label} height={30} width={130} />
        ))}
      </Grid>
      <Grid item xs={1}>
        <Box component="img" src={GitHubLogo} alt={"icon"} sx={iconSx} />
      </Grid>
    </Grid>
  );
}

export default PRBox;
