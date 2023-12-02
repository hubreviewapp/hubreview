import React from 'react';
import { Box, ThemeProvider } from '@mui/system';

interface LabelButtonProps {
  // Define the props you want to pass to PrDetailPage
  label: string;
}

const LabelButton: React.FC<LabelButtonProps> = ({ label }) => {
  // Your component logic here
  const color: string =
    label === "enhancement" ? "green" :
    label === "bug fix" ? "red" :
    label === "refactoring" ? "blue" :
    "";

    return (
      <Box
        sx={{
          width: 140,
          height: 35,
          borderRadius: 4,
          bgcolor: color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: "20px"
        }}
      >
        <p style={{ textAlign: 'center', margin: 0 }}>{label}</p>
      </Box>

    );
};

export default LabelButton;