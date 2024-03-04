import { Badge, Box, rem } from "@mantine/core";
import { IconTag } from "@tabler/icons-react";

const hubReviewLabels = {
  bug: "#d73a4a",
  enhancement: "#a2eeef",
  refactoring: "#6f42c1",
  question: "#0075ca",
  suggestion: "#28a745",
};
export type HubReviewLabelType = keyof typeof hubReviewLabels;

interface LabelButtonProps {
  label: HubReviewLabelType;
  size: string;
}

function getColorByKey(key: keyof typeof hubReviewLabels) {
  return hubReviewLabels[key] || "#808080"; // Default color is gray (#808080)
}

function LabelButton({ label, size }: LabelButtonProps) {
  const color = getColorByKey(label);

  const iconTag = <IconTag style={{ width: rem(15), height: rem(15) }} />;

  return (
    <Box>
      <Badge
        leftSection={iconTag}
        size={size}
        variant="gradient"
        gradient={{ from: "gray", to: color, deg: 90 }}
        key={1}
        m={3}
      >
        {label}
      </Badge>
    </Box>
  );
}

export default LabelButton;
