import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Paper, Typography } from '@mui/material';

const Documentation = () => {
  return (
    <PageLayout title="Documentation">
      <Paper sx={{ p: 3 }}>
        <Typography>System documentation and user guides will be available here.</Typography>
      </Paper>
    </PageLayout>
  );
};

export default Documentation;
