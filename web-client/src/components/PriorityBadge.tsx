import {Badge, Box} from "@mantine/core";

interface PriorityBadgeProps {
  label: string;
  size: string;

}

function PriorityBadge({ label, size }: PriorityBadgeProps) {
  const color =
    label === "High" ? "red" : label === "Medium" ? "yellow": "green";
  return (
    <Box>{
      label == "" ?
        <Badge size= {size} variant={"light"}>No Priority</Badge> :
        <Badge
          size= {size}
          variant="outline"
          color={color}
          key={1}
          m={3}>
          {label } Priority
        </Badge>
    }
    </Box>
  );
}

export default PriorityBadge;
