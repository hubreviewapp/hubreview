import { Badge, Box, rem } from "@mantine/core";
import { IconTag } from "@tabler/icons-react";


export type LabelType = "Bug Fix" | "Enhancement" | "Refactoring" | "Question" | "Suggestion";

interface LabelButtonProps {
  label: LabelType;
  size: string;
}

function LabelButton({ label, size }: LabelButtonProps) {
  const gradient: string[] =
    label === "Enhancement"
      ? ["pink", "violet"]
      : label === "Bug Fix"
        ? ["red", "pink"]
        : label == "Refactoring"
          ? ["teal", "lime"]
          : ["gray", "indigo"];
  const iconTag = <IconTag style={{ width: rem(15), height: rem(15) }} />;

  return (
    <Box>
      <Badge
        leftSection={iconTag}
        size={size}
        variant="gradient"
        gradient={{ from: gradient[0], to: gradient[1], deg: 90 }}
        key={1}
        m={3}
      >
        {label}
      </Badge>
    </Box>
  );
}

export default LabelButton;
