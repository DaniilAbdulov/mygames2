import React from 'react';
import {Box, Container} from '@mui/material';
import {AddGame} from '../../components/AddGamePage/AddGame';

export const AddGamePage: React.FC = () => {
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
        <AddGame />
      </Box>
    </Container>
  );
};
