import { Badge, Box, rem, Text, Card, Group, Anchor } from "@mantine/core";
import { IconCheckupList } from "@tabler/icons-react";
import { IconCircleCheck, IconXboxX } from "@tabler/icons-react";

import { PRDetail } from "../pages/PRDetailsPage.tsx";

export interface PRDetailTabProps {
  pull: PRDetail;
}

export default function PrDetailTab({ pull }: PRDetailTabProps) {
  const iconCheckupList = <IconCheckupList style={{ width: rem(27), height: rem(27) }} />;

  const checks = pull.checks;

  return (
    <Box>
      <Badge leftSection={iconCheckupList} size="lg" mb={10} variant="gradient" style={{ visibility: "visible" }}>
        Checks ( {pull.checksSuccess} / {pull.checks.length} )
      </Badge>
      <Box display="flex" style={{ flexWrap: "wrap" }}>
        {checks.map((check) => (
          <Card
            key={check.id}
            shadow="sm"
            component="a"
            padding="sm"
            href={check?.url}
            target="_blank"
            withBorder
            w="30%"
            style={{ marginBottom: "20px", marginRight: "20px" }}
          >
            <Group>
              <Text fw={500} size="lg" mt="md" style={{ marginBottom: "10px" }}>
                {check.name}
              </Text>

              <Text fw={500} size="lg" mt="md">
                {check.conclusion?.StringValue === "success" && (
                  <IconCircleCheck
                    color="green"
                    style={{ width: rem(22), height: rem(22), color: "green", marginLeft: "auto" }}
                  />
                )}
                {check.conclusion?.StringValue === "failure" && (
                  <IconXboxX
                    color="red"
                    style={{ width: rem(22), height: rem(22), color: "red", marginLeft: "auto" }}
                  />
                )}
              </Text>

              <Anchor
                href={check?.url}
                target="_blank"
                c="blue"
                style={{ position: "absolute", right: "15px", display: "flex" }}
              >
                Details
              </Anchor>
            </Group>
          </Card>
        ))}
      </Box>

      <br></br>
    </Box>
  );
}
