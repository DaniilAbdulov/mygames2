import React from 'react';
import {observer} from 'mobx-react-lite';
import {useStores} from '../../stores/useStores';
import {Box, Button, TextField, Typography} from '@mui/material';

type Event = {
  preventDefault: () => void;
};

export const AddGame: React.FC = observer(() => {
  const {gamesStore} = useStores();
  const {isLoading, values, setName, setYear, setAuthor, errors} = gamesStore;
  const {name, year, author} = values;

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    gamesStore.addGame();
  };

  return (
    <>
      <Box textAlign="center" mb={4}>
        <Typography variant="body1" color="text.secondary">
          Добавьте игру в вашу коллекцию
        </Typography>
      </Box>
      <form onSubmit={handleSubmit}>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
          <TextField
            fullWidth
            value={name}
            label="Название"
            onChange={(event) => setName(event.target.value)}
            error={!!errors?.name}
            helperText={!!errors?.name ? 'Введите название' : ''}
            disabled={isLoading}
          />
          <TextField
            fullWidth
            label="Год выхода"
            type={'number'}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            error={!!errors?.year}
            helperText={!!errors?.year ? 'Введите год выхода игры' : ''}
            disabled={isLoading}
          />
          <TextField
            fullWidth
            label="Издатель"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            error={!!errors?.author}
            helperText={!!errors?.author ? 'Введите издателя' : ''}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{
              py: 1.5,
              mt: 1,
            }}
          >
            {isLoading ? 'Добавляем...' : 'Добавить'}
          </Button>
        </Box>
      </form>
    </>
  );
});
