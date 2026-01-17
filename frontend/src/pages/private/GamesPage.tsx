import React from 'react';
import {Box, Container} from '@mui/material';
import {GamesList} from '../../components/GamesPage/GamesList';

export const GamesPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 8,
        }}
      >
        <GamesList />
      </Box>
    </Container>
  );
};
