import React from 'react';
import {CircularProgress, Box} from '@mui/material';

interface LoaderProps {
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({fullScreen = false}) => {
  const content = (
    <Box display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.paper"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return content;
};
