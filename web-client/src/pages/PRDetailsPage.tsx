import LabelButton from "../components/LabelButton";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import { Box, Badge, rem, Group, UnstyledButton } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import * as React from "react";
import { IconGitPullRequest, IconCircleDot } from '@tabler/icons-react';
import PrContextTab from "../tabs/PrContextTab.tsx";

interface PRDetailsPageProps {
  id: string;
  name: string;
}

function PRDetailsPage({ id, name }: PRDetailsPageProps) {
  const tabs = ["comments", "commits", "details", "modified files"];

  const [currentTab, setCurrentTab] = React.useState<string | null>(tabs[0]);

  const updateTab = (newTab: string | null) => {
    setCurrentTab(newTab);
  };

  return (
    <div style={{ textAlign: "left", marginLeft: 100 }}>
      <Group>
        <h2>
          {" "}
          {name} Fix: Resolve Critical User Authentication Bug
          <span style={{ color: "#778DA9" }}> #{id}</span>
        </h2>
        &ensp;&ensp;
        <Badge
          size="lg"
          color="green"
          key={1}
          style={{ marginTop: 25 }}
          rightSection={<IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />}
        >
          Open
        </Badge>
      </Group>
      <Group style={{ marginTop: -20 }}>
        <p> created at 4 days ago by <UnstyledButton c="blue">Irem Aydın </UnstyledButton></p>
        <p>
          <IconCircleDot size={18}/> &ensp; 1 issue linked
          <span style={{ color: "#778DA9" }}> at project Hubreview</span>
        </p>
      </Group>
      <Box display="flex" style={{ justifyContent: "flex-start" }}>
        <LabelButton label="Enhancement" size="lg" />
        <LabelButton label="Bug Fix" size="lg" />
      </Box>
      <br></br>
      <TabComp tabs={tabs} updateTab={updateTab} />
      <br></br>
      <Box >
        {currentTab === "modified files" && <ModifiedFilesTab />}
        {currentTab === "comments" && <CommentsTab />}
        {currentTab === "details" && <PrContextTab />}
        {currentTab === "commits" && <CommitsTab />}
      </Box>
    </div>
  );
}

export default PRDetailsPage;
