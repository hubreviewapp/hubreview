import LabelButton from "../components/LabelButton";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import CommitsTab from "../tabs/CommitsTab.tsx";
import {Box,Paper, Badge, rem, Grid, Text, Group, Title} from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import * as React from "react";
import {IconGitPullRequest, IconCircleDot, IconUserPlus, IconCheck, IconUserSearch, IconInfoCircle } from '@tabler/icons-react';
import PrContextTab from "../tabs/PrContextTab.tsx";


import PRDetailSideBar from "../components/PRDetailSideBar.tsx";

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
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
          {name} chore(deps): update dependency ts-node to v10.9.2
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
      <p style={{ marginTop: -20 }}> created at 4 days ago by Irem Aydın </p>
      <Box display="flex" style={{ justifyContent: "flex-start" }}>
        <LabelButton label="Enhancement" size="lg" />
        <LabelButton label="Bug Fix" size="lg" />
      </Box>
      <p style={{ marginRight: 20 }}>
        <IconCircleDot size={18} strokeWidth={3} /> &ensp; 1 issue linked
        <span style={{ color: "#778DA9" }}> at project Hubreview</span>
      </p>

      <br></br>
      <Grid>
        <Grid.Col span={8}>
          <TabComp tabs={tabs} updateTab={updateTab} />
          <br></br>
          <Box >

            {currentTab === "modified files" && <ModifiedFilesTab />}
            {currentTab === "comments" && <CommentsTab />}
            {currentTab === "details" && <PrContextTab />}
            {currentTab === "commits" && <CommitsTab />}
          </Box>

        </Grid.Col>
        {currentTab === "comments" && (
          <Grid.Col span={3}>
            <PRDetailSideBar></PRDetailSideBar>
          </Grid.Col>)}

      </Grid>
    </div>
  );
}

export default PRDetailsPage;
