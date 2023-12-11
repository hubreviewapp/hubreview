import LabelButton from "../components/LabelButton";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import { Box, Badge, rem } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import * as React from "react";
import {IconGitPullRequest, IconCircleDot } from '@tabler/icons-react';

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
}

function PRDetailsPage(props: PRDetailsPageProps) {
  const PRIcon = <IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />;
  const { id, name } = props;
  const tabs = ["comments", "commits", "details", "modified files"];


  const [currentTab, setCurrentTab] = React.useState<string | null>(tabs[0]);

  const updateTab = (newTab: string | null) => {

    setCurrentTab(newTab);
  };

  return (
    <div style={{ textAlign: "left",  marginLeft:100}}>
      <Box display="flex">
        <h2> {name} chore(deps): update dependency ts-node to v10.9.2
            <span style={{ color: "#778DA9" }} > #{id}</span>
        </h2>
        &ensp;&ensp;
        <Badge size={"lg"} color={"green"}  key={1} style={{marginTop:25}} rightSection={PRIcon}>
          Open
        </Badge>
      </Box>
      <p style={{marginTop:-20 }}> created at 4 days ago by Irem Aydın </p>
      <Box display="flex" style={{ justifyContent: "flex-start" }}>
        <LabelButton label={"enhancement"} size={"lg"} />
        <LabelButton label={"bug fix"} size={"lg"} />
      </Box>
      <p style={{ marginRight: 20 }}>
        <IconCircleDot
          size={18}
          strokeWidth={3}
        /> &ensp;
        1 issue linked
        <span style={{ color: "#778DA9" }} > at project Hubreview</span>
      </p>

      <br></br>

      <TabComp tabs={tabs} updateTab={updateTab} />
      <Box style={{width:900}}> current tab is {currentTab}
        {currentTab === "modified files" && <ModifiedFilesTab />}
        {currentTab === "comments" && <CommentsTab />}
      </Box>

    </div>
  );
}

export default PRDetailsPage;
