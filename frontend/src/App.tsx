import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {observer} from 'mobx-react-lite';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import {AppLayout} from './components/layout/AppLayout';
import {ProtectedRoute} from './components/ui/ProtectedRoute';
import {Loader} from './components/ui/Loader';

import {GamesPage} from './pages/private/GamesPage';
import {LoginPage} from './pages/public/LoginPage';

import {useStores} from './stores/useStores';
import {AddGamePage} from './pages/private/AddGamePage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4e1d9eff',
    },
    secondary: {
      main: '#9670d2ff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const AppContent: React.FC = observer(() => {
  const {userStore} = useStores();

  if (userStore.userIsLoading) {
    return <Loader fullScreen />;
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />

      {/* Приватные маршруты */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/games" replace />} />

        <Route
          path="games"
          element={
            <div style={{padding: '20px'}}>
              <GamesPage />
            </div>
          }
        />

        <Route
          path="/games/add"
          element={
            <div style={{padding: '20px'}}>
              <AddGamePage />
            </div>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
});

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default observer(App);
