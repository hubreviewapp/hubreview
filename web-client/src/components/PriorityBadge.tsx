import { Badge, Box } from "@mantine/core";

export type PriorityBadgeLabel = "Critical" | "High" | "Medium" | "Low" | null;

export interface PriorityBadgeProps {
  label?: PriorityBadgeLabel;
  size: string;
}

function PriorityBadge({ label, size }: PriorityBadgeProps) {
  const color = label === "Critical" ? "red" : label === "High" ? "orange" : label === "Medium" ? "yellow" : "green";
  return (
    <Box>
      {label === null ? (
        <Badge size={size} variant="light">
          No Priority
        </Badge>
      ) : (
        <Badge size={size} variant="outline" color={color} key={1} m={3}>
          {label} Priority
        </Badge>
      )}
    </Box>
  );
}

export default PriorityBadge;
