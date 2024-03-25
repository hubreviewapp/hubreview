import { Anchor, Tabs } from "@mantine/core";
import { PRDetailsPageTabName } from "../pages/PRDetailsPage";
import { Link } from "react-router-dom";

interface TabComponentProps {
  tabs: PRDetailsPageTabName[];
  currentTab: PRDetailsPageTabName;
}

function TabComp({ tabs, currentTab }: TabComponentProps) {
  const getLinkTarget = (targetTab: PRDetailsPageTabName) => {
    if (targetTab === currentTab) return ".";
    if (targetTab === tabs[0]) return "..";
    if (currentTab === tabs[0]) return targetTab;
    return `../${targetTab}`;
  };

  return (
    <Tabs color="#415A77" variant="pills" radius="md" value={currentTab ?? tabs[0]}>
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab} value={tab} leftSection="">
            <Anchor component={Link} to={getLinkTarget(tab)} relative="path" size="sm" td="none" c="white">
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Anchor>
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

export default TabComp;
