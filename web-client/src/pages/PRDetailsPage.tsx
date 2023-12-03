import React from "react";
import LabelButton from "../components/LabelButton";
import TabComponent from "../components/TabComponent";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";
import { Box, Typography } from "@mui/material";

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
  // Add more props as needed
}

function PRDetailsPage(props: PRDetailsPageProps) {
  // Access the props in the PrDetailPage component
  const { id, name } = props;
  const tabs = ["comments", "commits", "details", "modified files"];

  const [number, setNumber] = React.useState(0);

  // Function to update the number in the parent component
  const updateNumber = (newNumber: number) => {
    setNumber(newNumber);
  };

  return (
    <Box>
      <Box ml="auto" mr={16} textAlign="left">
        <Typography variant="h2">PR Detail Page</Typography>

        <Box display="flex" paddingRight={16}>
          <Box textAlign="right" mr={8}>
            <Typography variant="h2">
              {" "}
              {name} #{id} at project x
            </Typography>
          </Box>
          <Box>
            <Typography paragraph ml={10} mt={18}>
              {" "}
              created at 4 days ago{" "}
            </Typography>
          </Box>

          {/* Render additional details using props */}
        </Box>
        {/* Render additional details using props */}

        <Box display="flex" justifyContent="flex-start">
          <p> 1 issue linked to this pr --- </p>

          <LabelButton label={"enhancement"} width={140} height={35}></LabelButton>

          <LabelButton label={"bug fix"} width={140} height={35}></LabelButton>
        </Box>
      </Box>

      <TabComponent tabs={tabs} updateNumber={updateNumber}></TabComponent>

      <Box> current tab is {tabs[number]}</Box>

      {number === 3 && <ModifiedFilesTab />}
    </Box>
  );
}

export default PRDetailsPage;
