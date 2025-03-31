import React from 'react';
import { Container, Box, Typography, Grid2 } from '@mui/material';
import CustomButton from '../components/Button';
import CustomCard from '../components/Card';

const Home = () => {
  return (
    <Container>
      {/* Hero Section */}
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" gutterBottom>
          Welcome to MyApp
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover our features that help you succeed.
        </Typography>
        <CustomButton aria-label="Get started with MyApp">Get Started</CustomButton>
      </Box>

      {/* Features Grid */}
      <Grid2 container spacing={3} justifyContent="center">
        <Grid2 item xs={12} sm={6} md={4}>
          <CustomCard title="Feature 1" content="This is a description of feature 1." />
        </Grid2>
        <Grid2 item xs={12} sm={6} md={4}>
          <CustomCard title="Feature 2" content="This is a description of feature 2." />
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default Home;
