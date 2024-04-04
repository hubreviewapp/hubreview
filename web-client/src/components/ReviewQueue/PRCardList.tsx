import { Paper, Group, Text } from "@mantine/core";
import { PRInfo } from "../../models/PRInfo.tsx";
import PRCard from "./PRCard";

export interface PRCardListProps {
  pr: PRInfo[];
  name: string;
}

function PRCardList({ pr, name }: PRCardListProps) {
  return (
    <Paper mt="sm" withBorder>
      <Group>
        <Text m="sm" c="cyan">
          {name} ({pr.length})
        </Text>
        {pr.length === 0 ? (
          <Text m="sm" c="dimmed">
            No Pull Requests
          </Text>
        ) : (
          <></>
        )}
      </Group>

      {pr.map((info) => (
        <PRCard key={info.id} data={info} />
      ))}
    </Paper>
  );
}

export default PRCardList;
