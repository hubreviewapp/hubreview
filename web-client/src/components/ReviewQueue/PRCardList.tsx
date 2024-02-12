import {Paper, Group, Text} from "@mantine/core";
import {PRInfo} from "../../models/PRInfo.tsx";
import PRCard from "./PRCard";
import {ReviewQueuePullRequest} from "../../pages/ReviewQueuePage";

export interface PRCardListProps {
  pr: PRInfo[];
  name: string;
}

function PRCardList({pr, name}: PRCardListProps) {

  //console.log(name);
  //console.log(pr.length == 1 ? pr[0].title : pr);

  return (
    <Paper my="sm" withBorder>
      <Group>
        <Text m="sm" c="cyan">{name} ({pr.length})</Text>
        {pr.length === 0 ? (
          <Text m="sm" c="dimmed">No Pull Requests</Text>
        ) : (
          <></>
        )}
      </Group>

      {pr.map((info) =>  (<PRCard key={info.id} data={info}/>) )}
      
      {/*pr.map((info) => (
        <PRCard key={info.id} data={info}/>
      ))*/}
    </Paper>

  )
}

export default PRCardList;
