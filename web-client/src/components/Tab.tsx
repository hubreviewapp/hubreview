import { Tabs } from "@mantine/core";
import { useState } from "react";
//import { IconPhoto, IconMessageCircle, IconSettings } from '@tabler/icons-react';

interface TabComponentProps {
  tabs: string[];
  updateTab: (newTab: string | null) => void;
}

function TabComp({ tabs, updateTab }: TabComponentProps) {
  const [activeTab, setActiveTab] = useState<string | null>(tabs[0]);

  const handleChange = (newValue: string | null) => {
    setActiveTab(newValue);
    updateTab(newValue);
  };
  //const iconStyle = { width: rem(12), height: rem(12) };
  return (
    <Tabs color="#415A77" variant="pills" radius="md" defaultValue={activeTab} onChange={handleChange}>
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab} value={tab} leftSection={""}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}

export default TabComp;
