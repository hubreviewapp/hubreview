import React from "react";
import LabelButton from "../components/LabelButton";
import TabComponent from "../components/TabComponent";
import ModifiedFilesTab from "../tabs/ModifiedFilesTab";

interface PRDetailsPageProps {
  // Define the props you want to pass to PrDetailPage
  id: string;
  name: string;
  // Add more props as needed
}

const PRDetailsPage: React.FC<PRDetailsPageProps> = (props) => {
  // Access the props in the PrDetailPage component
  const { id, name } = props;
  const tabs = ["comments", "commits", "details", "modified files"];

  const [number, setNumber] = React.useState(0);

  // Function to update the number in the parent component
  const updateNumber = (newNumber: number) => {
    setNumber(newNumber);
  };

  return (
    <div>
      <div style={{ marginLeft: "auto", marginRight: 16, textAlign: "left" }}>
        <h2>PR Detail Page</h2>

        <div style={{ display: "flex", paddingRight: "16px" }}>
          <div style={{ textAlign: "right", marginRight: "8px" }}>
            <h2 style={{ fontSize: "1.2em" }}>
              {" "}
              {name} #{id} at project x
            </h2>
          </div>
          <div>
            <p style={{ marginLeft: "10px", marginTop: "18px" }}> created at 4 days ago </p>
          </div>

          {/* Render additional details using props */}
        </div>
        {/* Render additional details using props */}

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <p> 1 issue linked to this pr --- </p>

          <LabelButton label={"enhancement"} width={140} height={35}></LabelButton>

          <LabelButton label={"bug fix"} width={140} height={35}></LabelButton>
        </div>
      </div>

      <TabComponent tabs={tabs} updateNumber={updateNumber}></TabComponent>

      <div> current tab is {tabs[number]}</div>

      {number === 3 && <ModifiedFilesTab id={"1"} name={"name"} />}
    </div>
  );
};

export default PRDetailsPage;
