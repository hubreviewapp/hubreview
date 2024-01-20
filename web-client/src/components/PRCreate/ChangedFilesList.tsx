import {Box, rem, NavLink, Title} from '@mantine/core';
import {IconFileDiff, IconFolderFilled} from '@tabler/icons-react';

function ChangedFilesList() {
  //TODO: set active file
  //const [activeFile, setActiveFile]  =useState("index.html");

  return (
    <Box w="300px" p="md">
      <Title order={6}>
        <IconFileDiff style={{width: rem(18), height: rem(18)}}/>
        {" "}
        Changed Files</Title>
      <NavLink
        href="#required-for-focus"
        label="src"
        leftSection={<IconFolderFilled size="1rem" stroke={1.5}/>}
        childrenOffset={28}
        defaultOpened
      >
        <NavLink href="#required-for-focus" label="App.tsx"/>
        <NavLink label="index.html" href="#required-for-focus"/>
        <NavLink label="components" childrenOffset={28} href="#required-for-focus"
                 leftSection={<IconFolderFilled size="1rem" stroke={1.5}/>}>
          <NavLink label="NavBar.tsx" href="#required-for-focus"/>
          <NavLink label="Badge.tsx" href="#required-for-focus"/>
          <NavLink label="Button.tsx" href="#required-for-focus"/>
        </NavLink>
      </NavLink>

      <NavLink
        href="#required-for-focus"
        label="public"
        leftSection={<IconFolderFilled size="1rem" stroke={1.5}/>}
        childrenOffset={28}
      >
        <NavLink label="logo.svg" href="#required-for-focus"/>
        <NavLink label="prettier.json" href="#required-for-focus"/>
      </NavLink>
    </Box>
  );
}

export default ChangedFilesList;
