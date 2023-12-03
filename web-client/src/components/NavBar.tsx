import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

function NavBar() {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#0D1B2A' }}>
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', textDecoration: 'none', flexGrow: 0.05, marginRight: 10 }} >
          HubReview
        </Typography>
        <Button component={Link} to="/" color="inherit">
          Pull Requests
        </Button>
        <Button component={Link} to="/repositories" color="inherit">
          Repositories
        </Button>

        <Button component={Link} to="/analytics" color="inherit">
          Analytics
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
