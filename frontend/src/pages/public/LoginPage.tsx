import React, {useState, useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import {Box, Button, Container, TextField, Typography} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {useStores} from '../../stores/useStores';

type Event = {
  preventDefault: () => void;
};

export const LoginPage: React.FC = observer(() => {
  const {userStore} = useStores();
  const {formValues, errors, setPhone, setPassword, isLoading} = userStore;
  const {phone, password} = formValues;
  const navigate = useNavigate();

  useEffect(() => {
    if (userStore.isAuthenticated) {
      navigate('/');
    }
  }, [userStore.isAuthenticated, navigate]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    userStore.login();
  };

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
        <Box textAlign="center" mb={4}>
          <Typography variant="body1" color="text.secondary">
            Введите ваш телефон и пароль для входа
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
            <TextField
              fullWidth
              value={phone}
              label="Телефон"
              onChange={(event) => setPhone(event.target.value)}
              error={!!errors?.phone}
              helperText={!!errors?.phone ? 'Введите номер телефона' : ''}
              disabled={isLoading}
            />
            <TextField
              fullWidth
              label="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={!!errors?.password}
              helperText={!!errors?.password ? 'Введите пароль' : ''}
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
              {userStore.isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
});
