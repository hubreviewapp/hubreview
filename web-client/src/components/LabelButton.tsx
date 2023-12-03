import React from 'react';
import { Box } from '@mui/system';

interface LabelButtonProps {
  label: string;
  width: number;
  height: number;
}

function LabelButton({ label, width, height }: LabelButtonProps) {
  const color: string =
    label === "enhancement" ? "green" :
    label === "bug fix" ? "red" :
    label === "refactoring" ? "blue" :
    "";

    return (
      <Box
        sx={{
          width: {width},
          height: {height},
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
