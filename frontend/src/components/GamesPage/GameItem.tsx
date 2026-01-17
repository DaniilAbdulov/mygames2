import {Box, Card, CardContent, Typography} from '@mui/material';
import {Game} from '../../stores/GamesStore';

export const GameItem = ({game}: {game: Game}) => {
  const {name, year, author} = game;
  return (
    <Card sx={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <CardContent sx={{flexGrow: 1}}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box>
            <Typography variant="h6" component="div">
              {name}
            </Typography>
            <Typography variant="h6" component="div">
              {year}
            </Typography>
            <Typography variant="h6" component="div">
              {author}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
