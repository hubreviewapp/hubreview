import LabelButton from "../components/LabelButton";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import { Box, Badge, rem, Grid, Text } from "@mantine/core";
import TabComp from "../components/Tab.tsx";
import * as React from "react";
import { IconGitPullRequest, IconCircleDot, IconUserPlus, IconCheck } from "@tabler/icons-react";
import PrContextTab from "../tabs/PrContextTab.tsx";
import UserLogo from "../assets/icons/user.png";
import classes from "../styles/PRList.module.css";

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
}

function PRDetailsPage({ id, name }: PRDetailsPageProps) {
  const PRIcon = <IconGitPullRequest style={{ width: rem(18), height: rem(18) }} />;

  const tabs = ["comments", "commits", "details", "modified files"];

  const [currentTab, setCurrentTab] = React.useState<string | null>(tabs[0]);

  const updateTab = (newTab: string | null) => {
    setCurrentTab(newTab);
  };

  return (
    <div style={{ textAlign: "left", marginLeft: 100 }}>
      <Box display="flex">
        <h2>
          {" "}
          {name} chore(deps): update dependency ts-node to v10.9.2
          <span style={{ color: "#778DA9" }}> #{id}</span>
        </h2>
        &ensp;&ensp;
        <Badge size={"lg"} color={"green"} key={1} style={{ marginTop: 25 }} rightSection={PRIcon}>
          Open
        </Badge>
      </Box>
      <p style={{ marginTop: -20 }}> created at 4 days ago by Irem Aydın </p>
      <Box display="flex" style={{ justifyContent: "flex-start" }}>
        <LabelButton label={"enhancement"} size={"lg"} />
        <LabelButton label={"bug fix"} size={"lg"} />
      </Box>
      <p style={{ marginRight: 20 }}>
        <IconCircleDot size={18} strokeWidth={3} /> &ensp; 1 issue linked
        <span style={{ color: "#778DA9" }}> at project Hubreview</span>
      </p>

      <br></br>
      <Grid>
        <Grid.Col span={7.5}>
          <TabComp tabs={tabs} updateTab={updateTab} />
          <Box style={{ width: 900 }}>
            {" "}
            current tab is {currentTab}
            {currentTab === "modified files" && <ModifiedFilesTab />}
            {currentTab === "comments" && <CommentsTab />}
            {currentTab === "details" && <PrContextTab />}
          </Box>
        </Grid.Col>
        <Grid.Col span={3}>
          <Box style={{ border: "solid 0.5px cyan", borderRadius: "10px", padding: "8px" }}>
            <Text size="lg" style={{ style: "bold" }}>
              {" "}
              Reviewers{" "}
            </Text>
            <Box style={{ display: "flex", marginBottom: "3px" }}>
              <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
              <Text size={"md"} style={{ padding: "3px" }}>
                irem_aydın
              </Text>{" "}
              &ensp;
              <IconCheck size={24} strokeWidth={3} color={"green"} />
            </Box>
            <br></br>
            <Box style={{ display: "flex" }}>
              <Text size="lg" style={{ style: "bold" }}>
                {" "}
                Assignees{" "}
              </Text>
              <IconUserPlus style={{ width: rem(18), height: rem(18), alignItems: "right" }} />
            </Box>
            <Box style={{ display: "flex", marginBottom: "3px" }}>
              <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
              <Text size={"md"} style={{ padding: "3px" }}>
                ecekahraman
              </Text>
            </Box>

            <Box style={{ display: "flex", marginBottom: "3px" }}>
              <Box component="img" src={UserLogo} alt={"logo"} className={classes.logo} />
              <Text size={"md"} style={{ padding: "3px" }}>
                irem_aydın
              </Text>
            </Box>

            <br></br>

            <Text size="lg" style={{ style: "bold" }}>
              {" "}
              Number of req. approves{" "}
            </Text>
            <Box style={{ display: "flex", marginBottom: "3px" }}>
              <Badge size={"lg"} color={""} style={{ marginTop: 10 }}>
                1/3
              </Badge>
            </Box>
          </Box>
        </Grid.Col>
      </Grid>
    </div>
  );
}

export default PRDetailsPage;
