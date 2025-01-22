import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Sidebar from '../components/layout/Sidebar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Home = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          bgcolor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CheckCircleIcon 
              sx={{ 
                fontSize: 40,
                color: '#1976d2'
              }} 
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: '#1976d2',
                fontWeight: 'bold'
              }}
            >
              SmartAnnotator
            </Typography>
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: '#666',
              maxWidth: 600,
              textAlign: 'center',
              mt: 2
            }}
          >
            Welcome to SmartAnnotator - Your intelligent document annotation platform.
            Use the sidebar to navigate through your projects and start annotating!
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
