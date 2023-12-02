// src/components/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const Navbar: React.FC = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#0D1B2A' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0.15}}>
          HubReview
        </Typography>
        <Button component={Link} to="/" color="inherit">
          Home
        </Button>
        <Button component={Link} to="/about" color="inherit">
          About
        </Button>
        <Button component={Link} to="/contact" color="inherit">
          Contact
        </Button>

        <Button component={Link} to="/analytics" color="inherit">
          Analytics
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;