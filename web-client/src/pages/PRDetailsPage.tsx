import React from "react";
import LabelButton from "../components/LabelButton";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import CommentsTab from "../tabs/CommentsTab.tsx";
import {Box} from "@mantine/core";
import TabComp from "../components/Tab.tsx"

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
}

function PRDetailsPage(props: PRDetailsPageProps) {
  // Access the props in the PrDetailPage component
  const { id, name } = props;
  const tabs = ["comments", "commits", "details", "modified files"];

  const [currentTab, setCurrentTab] = React.useState<string|null>(tabs[1]);

  // Function to update the number in the parent component
  const updateTab = (newTab: string|null) => {
    setCurrentTab(newTab);
  };

  return (
    <div style={{backgroundColor:'#1B263B', textAlign:"left", marginTop:-25}}>
        <h2>PR Detail Page</h2>
        <div style={{display:"flex", marginTop: -25, marginBottom:-20 }}>
            <h3  style={{marginRight:20}} >
              {name} #{id} at project x
            </h3>

            <p>
              {" "}
              {"     "} created at 4 days ago{" "}
            </p>
        </div>


        <Box display="flex" style= {{justifyContent:"flex-start"}}>
          <p style={{marginRight:20}}> 1 issue linked to this pr --- </p>

          <LabelButton label={"enhancement"} width={140} height={35}></LabelButton>

          <LabelButton label={"bug fix"} width={140} height={35}></LabelButton>
        </Box>

      <TabComp tabs={tabs} updateTab={updateTab}></TabComp>



      <Box> current tab is {currentTab}</Box>

      {currentTab === 'modified files' && <ModifiedFilesTab />}

      {currentTab === 'comments' && <CommentsTab />}


    </div>
  );
}

export default PRDetailsPage;
