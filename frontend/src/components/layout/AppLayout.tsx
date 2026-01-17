import React from 'react';
import {observer} from 'mobx-react-lite';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  CalendarToday,
  Person,
  ExitToApp,
} from '@mui/icons-material';
import {Link as RouterLink, useNavigate, Outlet} from 'react-router-dom';
import {useStores} from '../../stores/useStores';

export const AppLayout: React.FC = observer(() => {
  const {userStore} = useStores();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    userStore.logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{mr: 2}}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={RouterLink}
            to="/games"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            My Games
          </Typography>

          <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
            <Avatar sx={{bgcolor: 'secondary.main', width: 32, height: 32}}>
              {userStore.user?.fullName?.charAt(0) || 'U'}
            </Avatar>
            <Typography
              variant="body2"
              sx={{display: {xs: 'none', sm: 'block'}}}
            >
              {userStore.user?.fullName}
            </Typography>
          </Box>
        </Toolbar>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            component={RouterLink}
            to="/games"
            onClick={handleMenuClose}
          >
            <CalendarToday sx={{mr: 1}} />
            Мои игры
          </MenuItem>

          <MenuItem
            component={RouterLink}
            to="/games/add"
            onClick={handleMenuClose}
          >
            <CalendarToday sx={{mr: 1}} />
            Добавить игру
          </MenuItem>

          <MenuItem onClick={handleLogout} sx={{color: 'error.main'}}>
            <ExitToApp sx={{mr: 1}} />
            Выйти
          </MenuItem>
        </Menu>
      </AppBar>

      <Container component="main" sx={{flex: 1, py: 3}}>
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
          >
            Версия 1.0.0
          </Typography>
        </Container>
      </Box>
    </Box>
  );
});
