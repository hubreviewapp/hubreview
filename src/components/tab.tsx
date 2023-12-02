// src/TabComponent.tsx
import React from 'react';
import { Tabs, Tab, Paper } from '@mui/material';

interface TabComponentProps {
    tabs: string[];
    updateNumber: (newNumber: number) => void;
}

const TabComponent: React.FC<TabComponentProps> = ({ tabs, updateNumber }) => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        updateNumber(newValue)
    };

    return (
        <div style={{ padding: 16 }}>
            <Paper elevation={3}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    centered
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab} />
                    ))}
                </Tabs>
            </Paper>
            {/* Add your tab content here based on the selected tab value */}
            {tabs.map((content, index) => (
                value === index && <div key={index}>{content} Content</div>
            ))}
        </div>
    );
};

export default TabComponent;
