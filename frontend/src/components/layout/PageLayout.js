import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import HomeButton from '../common/HomeButton';

const PageLayout = ({ title, children }) => {
  return (
    <Box sx={{ p: 3 }}>
      <HomeButton />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {children}
      </Container>
    </Box>
  );
};

export default PageLayout;
