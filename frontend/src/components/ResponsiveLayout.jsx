/**
 * ResponsiveLayout.jsx
 *
 * A production‑ready layout component that ensures responsiveness and accessibility.
 *
 * Features:
 * • Uses Material‑UI's Grid system and breakpoints for a responsive layout.
 * • Semantic HTML: header, main, aside, footer for improved accessibility.
 * • ARIA labels on interactive elements and sections.
 * • Supports keyboard navigation by setting appropriate tab indices.
 *
 * International Coding Standards:
 * • Clear inline documentation and descriptive variable names.
 * • Consistent formatting and modular design.
 */

import React from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';

const ResponsiveLayout = ({ children }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box component="div">
      {/* Header: Semantic tag with ARIA label */}
      <header
        aria-label="Main Navigation"
        style={{
          backgroundColor: theme.palette.primary.main,
          padding: theme.spacing(2),
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h5" component="h1" color="white">
            MyApp
          </Typography>
        </Container>
      </header>

      {/* Main Content Area */}
      <main>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={2}>
            {/* Primary content section */}
            <Grid item xs={12} md={8}>
              <Box
                component="section"
                tabIndex="0"
                aria-label="Main Content"
                sx={{ outline: 'none' }}
              >
                {children}
              </Box>
            </Grid>

            {/* Sidebar with supplementary content */}
            <Grid item xs={12} md={4}>
              <Box
                component="aside"
                sx={{
                  p: 2,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: 1,
                  minHeight: isDesktop ? '200px' : 'auto',
                }}
                aria-label="Sidebar"
              >
                <Typography variant="h6" component="h2">
                  Sidebar
                </Typography>
                <Typography variant="body1" component="p" sx={{ mt: 1 }}>
                  Supplementary information and navigation links can be placed
                  here.
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  aria-label="Learn More"
                  onClick={() => alert('Learn More clicked!')}
                >
                  Learn More
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </main>

      {/* Footer: Semantic tag */}
      <footer>
        <Box
          component="footer"
          sx={{
            py: 2,
            backgroundColor: theme.palette.grey[200],
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} MyApp. All rights reserved.
          </Typography>
        </Box>
      </footer>
    </Box>
  );
};

export default ResponsiveLayout;
