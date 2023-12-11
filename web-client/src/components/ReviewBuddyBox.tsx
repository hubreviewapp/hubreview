import {
  Button,
  Flex,
  Grid,
  Group,
  Paper,
  Box,
  Progress,
  rem,
  Stack,
  Text,
  Tooltip,
  Badge,
} from "@mantine/core";
import {IconArrowsHorizontal, IconUser} from "@tabler/icons-react";


function ReviewBuddyBox(){

  const reviewBuddies = [
    {
      id: 1,
      usernames: ["ayse_kelleci","ece_kahraman"],
      rates:["50%", "80%"]
    },
    {
      id: 2,
      usernames: ["irem_Aydin","gulcin_eyupoglu"],
      rates:["40%", "60%"]
    },
    {
      id: 3,
      usernames: ["alper_mum","vedat_xyz"],
      rates:["30%", "50%"]
    },
  ]
  const iconArrowsHorizontal = <IconArrowsHorizontal style={{ width: rem(18), height: rem(18) }}/>;
  return(
    <Box w={"370px"}>
      <Paper shadow="xl" radius="md" p="sm" mt={"lg"} withBorder>
        <Text align={"center"} fw={500} size={"lg"}>Frequent Review Buddies</Text>

        <Stack >
          {
            reviewBuddies.map(itm=>(
              <Box key={itm.id}>
                <IconUser style={{ width: rem(18), height: rem(18) }}/>
                {itm.usernames[1]}
              </Box>
            ))
          }
        </Stack>
      </Paper>
    </Box>
  );
}

export default ReviewBuddyBox;
