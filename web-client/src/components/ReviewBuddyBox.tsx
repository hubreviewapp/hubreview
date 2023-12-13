import {
  Button,
  Group,
  Paper,
  Box,
  rem,
  Stack,
  Text,
  Tooltip,
  Badge,
} from "@mantine/core";
import {IconArrowsHorizontal, IconInfoCircle} from "@tabler/icons-react";


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
    {
      id: 4,
      usernames: ["alper_mum","vedat_xyz"],
      rates:["30%", "50%"]
    },
  ];
  const iconInfo = <IconInfoCircle style={{ width: rem(18), height: rem(18) }}/>;

  return(
    <Box w={"400px"} >
      <Paper  h={"280px"} shadow="xl" radius="md" p="sm" mt={"lg"} withBorder>
        <Text align={"center"} fw={500} size={"lg"} mb={"sm"}>Frequent Review Buddies
          <Tooltip label={"The percentage values indicate the proportion of opened pull requests that were reviewed by the given buddy."}>
            <Badge leftSection={iconInfo} variant={"transparent"}/>
          </Tooltip>
        </Text>
        <Stack align="center">
          <Box>
          {
            reviewBuddies.map(itm=>(
              <Group key={itm.id} mt={"sm"}>
                <Text>{itm.usernames[0]}</Text>
                <Text color={"indigo"}>{itm.rates[0]}</Text>
                <IconArrowsHorizontal color={"green"} style={{ width: rem(18), height: rem(18) }}/>
                <Text color={"indigo"}>{itm.rates[1]}</Text>
                <Text>{itm.usernames[1]}</Text>
              </Group>

            ))
          }
          </Box>
          <Button>See More</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ReviewBuddyBox;
