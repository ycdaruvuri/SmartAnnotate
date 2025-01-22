import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Paper, Typography } from '@mui/material';

const Statistics = () => {
  return (
    <PageLayout title="Statistics">
      <Paper sx={{ p: 3 }}>
        <Typography>Project statistics and analytics will be displayed here.</Typography>
      </Paper>
    </PageLayout>
  );
};

export default Statistics;
