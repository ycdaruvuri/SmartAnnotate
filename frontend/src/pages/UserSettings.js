import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Paper, Typography } from '@mui/material';

const UserSettings = () => {
  return (
    <PageLayout title="User Settings">
      <Paper sx={{ p: 3 }}>
        <Typography>User settings and preferences will be configured here.</Typography>
      </Paper>
    </PageLayout>
  );
};

export default UserSettings;
