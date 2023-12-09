import {Badge, Box} from "@mantine/core";

interface LabelButtonProps {
  label: string;
  size: string
}

function LabelButton({ label, size }: LabelButtonProps) {
  const color: string[]  =
    label === "enhancement" ? ["pink","violet"] : label === "bug fix" ? ["red","pink"]  :["teal","lime"];

  return (
    <Box>
        <Badge
          size= {size}
          variant="gradient"
          gradient={{ from: color[0], to: color[1], deg: 90 }}
          key={1}
          m={3}>
          {label }
        </Badge>
    </Box>

  );
}

export default LabelButton;
