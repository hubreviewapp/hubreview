import {Box, Button, Card, CardActions, CardContent, SxProps, Typography} from "@mui/material";
import "../styles/common.css";
import GitHubLogo from "../assets/icons/github-logo.png";

const iconSx: SxProps = {
  width: 30,
  height: 30,
  ml: 1,
  mt : -0.5,
  borderRadius: 20,

};
function RepositoriesPage() {
  const repos = [
    {
      id: 1,
      name: "HubReview",
      owner: "Ayse Kelleci",
      created: "01-01-2021"
    },{
    id: 2,
    name: "ReLink",
    owner: "Cagatay Safak",
    created: "01-01-2021"
  },
    {
    id: 3,
    name: "Eventium",
    owner: "Ece Kahraman",
    created: "01-01-2021"
},

  ]

  return (
    <Box height={600} p={0} m={0} width="100%" display="flex" flexDirection={"column"}
         padding={"30px"}  sx={{ backgroundColor: "#1B263B" }}>

      <Box p={5} display="flex"  width="90%">
        {repos.map((item) => (
          <Card key={item.id} sx={{
            width: 250,
            margin: 3,
            border: "solid 1px #BCBCBC",
            borderRadius: "10px",
            backgroundColor: "#24324f",
          }}>
            <CardContent>
              <Typography variant="h5" component="div">
                {item.name}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="text.secondary">
                created by  {item.owner}
              </Typography>
              <Typography variant="body2">
               Last Modified: {item.created}
                <br />
              </Typography>
            </CardContent>
            <CardActions style={{display:"flex", justifyContent:"space-evenly"}} >
              <Box component="img" src={GitHubLogo} alt={"icon"} sx={iconSx} />
              <Button size="small" >Edit</Button>
              <Button size="small" color={"error"}>Delete</Button>
            </CardActions>
          </Card>
        ))}
      </Box>


    </Box>
  );
}

export default RepositoriesPage;
