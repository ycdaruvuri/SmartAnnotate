import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

const menuItems = [
  { text: 'Home', path: '/home', icon: <HomeIcon /> },
  { text: 'User Settings', path: '/settings' },
  { text: 'Pipelines', path: '/pipelines' },
  { text: 'Projects', path: '/projects' },
  { text: 'Variables', path: '/variables' },
  { text: 'Statistics', path: '/statistics' },
  { text: 'Documentation', path: '/docs' },
  { text: 'About us', path: '/about' },
];

const Sidebar = () => {
  return (
    <Box
      sx={{
        width: 250,
        height: '100vh',
        borderRight: '1px solid #1976d2',
        bgcolor: 'white',
      }}
    >
      <List>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  py: 2,
                  '&:hover': {
                    bgcolor: '#e3f2fd',
                  },
                }}
              >
                {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '1rem',
                    fontWeight: 'normal',
                    color: '#1976d2'
                  }}
                />
              </ListItemButton>
            </ListItem>
            {index < menuItems.length - 1 && (
              <Divider sx={{ borderColor: '#e0e0e0' }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
