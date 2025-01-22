import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Paper, Typography } from '@mui/material';

const Variables = () => {
  return (
    <PageLayout title="Variables">
      <Paper sx={{ p: 3 }}>
        <Typography>Variable management and configuration will be available here.</Typography>
      </Paper>
    </PageLayout>
  );
};

export default Variables;
