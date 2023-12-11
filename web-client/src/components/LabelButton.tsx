import {Badge, Box, rem} from "@mantine/core";
import {IconTag} from "@tabler/icons-react";

interface LabelButtonProps {
  label: string;
  size: string;

}

function LabelButton({ label, size }: LabelButtonProps) {
  const gradient: string[]  =
    label === "enhancement" ? ["pink","violet"] : label === "bug fix" ? ["red","pink"] :
      label == "refactoring" ? ["teal","lime"] : ["gray", "indigo"];
  const iconTag = <IconTag style={{ width: rem(15), height: rem(15) }} />;

  return (
    <Box>
        <Badge
          leftSection={iconTag}
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
