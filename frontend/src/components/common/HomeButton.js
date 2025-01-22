import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

const HomeButton = ({ position = { top: 20, left: 20 } }) => {
  const navigate = useNavigate();

  return (
    <Tooltip title="Go to Home">
      <IconButton
        onClick={() => navigate('/home')}
        sx={{
          position: 'fixed',
          ...position,
          bgcolor: 'white',
          boxShadow: 2,
          '&:hover': {
            bgcolor: '#e3f2fd',
          },
          zIndex: 1000,
        }}
      >
        <HomeIcon sx={{ color: '#1976d2' }} />
      </IconButton>
    </Tooltip>
  );
};

export default HomeButton;
