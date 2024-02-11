import {Paper, Group, Text} from "@mantine/core";
import {ReviewQueuePullRequest} from "../../pages/ReviewQueuePage";
import PRCard from "./PRCard";

export interface PRCardListProps {
  pr: ReviewQueuePullRequest[];
  name: string;
}

function PRCardList({pr, name}: PRCardListProps) {
  return (
    <Paper my="sm" withBorder>
      <Group>
        <Text m="sm" c="cyan">{name} ({pr.length})</Text>
        {
          pr.length == 0 ?
            <Text m="sm" c="dimmed">No Pull Requests</Text>
            :<></>

        }
      </Group>

      {pr.map((item) => (
        <PRCard key={item.id} data={item}/>
      ))}
    </Paper>

  )
}

export default PRCardList;
