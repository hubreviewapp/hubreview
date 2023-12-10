import {Badge, Box} from "@mantine/core";

interface LabelButtonProps {
  label: string;
  size: string;

}

function LabelButton({ label, size }: LabelButtonProps) {
  const gradient: string[]  =
    label === "enhancement" ? ["pink","violet"] : label === "bug fix" ? ["red","pink"] :
      label == "refactoring" ? ["teal","lime"] : ["gray", "indigo"];

  return (
    <Box>
        <Badge
          size= {size}
          variant="gradient"
          gradient={{ from: gradient[0], to: gradient[1], deg: 90 }}
          key={1}
          m={3}>
          {label }
        </Badge>
    </Box>

  );
}

export default LabelButton;
