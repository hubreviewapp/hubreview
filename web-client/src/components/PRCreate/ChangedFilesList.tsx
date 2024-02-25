import { Box, rem, NavLink, Title } from "@mantine/core";
import { IconFileDiff, IconFolderFilled, IconFile } from "@tabler/icons-react";
import { useState } from "react";

function ChangedFilesList() {
  const [activeFile, setActiveFile] = useState("index.html");
  const file = (fileName: string) => (
    <NavLink
      href="#required-for-focus"
      onClick={() => setActiveFile(fileName)}
      style={activeFile === fileName ? { backgroundColor: "rgba(8,68,98,0.64)" } : null}
      label={fileName}
      leftSection={<IconFile size="1rem" stroke={1.5} />}
    />
  );
  return (
    <Box w="300px" p="md" h="400px">
      <Title order={6}>
        <IconFileDiff style={{ width: rem(18), height: rem(18) }} /> Changed Files
      </Title>
      <NavLink
        href="#required-for-focus"
        label="src"
        leftSection={<IconFolderFilled size="1rem" stroke={1.5} />}
        childrenOffset={28}
        defaultOpened
      >
        {file("App.tsx")}
        {file("index.html")}
        <NavLink
          label="components"
          childrenOffset={28}
          href="#required-for-focus"
          leftSection={<IconFolderFilled size="1rem" stroke={1.5} />}
        >
          {file("Navbar.tsx")}
          {file("Badge.tsx")}
          {file("Button.tsx")}
        </NavLink>
      </NavLink>

      <NavLink
        href="#required-for-focus"
        label="public"
        leftSection={<IconFolderFilled size="1rem" stroke={1.5} />}
        childrenOffset={28}
      >
        {file("logo.svg")}
      </NavLink>
    </Box>
  );
}

export default ChangedFilesList;
