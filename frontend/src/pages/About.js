import React from 'react';
import PageLayout from '../components/layout/PageLayout';
import { Paper, Typography, Box } from '@mui/material';

const About = () => {
  return (
    <PageLayout title="About Us">
      <Paper sx={{ p: 3 }}>
        <Box sx={{ maxWidth: 800 }}>
          <Typography paragraph>
            SmartAnnotator is an intelligent document annotation platform designed to streamline
            the process of annotating and managing documents for machine learning projects.
          </Typography>
          <Typography paragraph>
            Our platform provides powerful tools for creating, managing, and collaborating
            on annotation projects, with built-in support for various annotation types
            and intelligent features to enhance productivity.
          </Typography>
        </Box>
      </Paper>
    </PageLayout>
  );
};

export default About;
