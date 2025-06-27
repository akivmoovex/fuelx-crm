import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Customers', path: '/customers' },
  { label: 'Users', path: '/users' },
  { label: 'Deals', path: '/deals' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' }
];

const logout = () => {
  localStorage.removeItem('token');
  setUser(null);
  // Optionally, redirect:
  window.location.href = '/login';
};

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const location = useLocation();

  // Example company logo (replace with your own or from user/company data)
  const companyLogoUrl = '/logo192.png'; // or wherever your logo is

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {/* Company Logo */}
          <Avatar src={companyLogoUrl} alt="Company Logo" sx={{ mr: 1, width: 36, height: 36 }} />
          <Typography variant="h6" component="div" sx={{ mr: 2, fontWeight: 700 }}>
            FuelX CRM
          </Typography>
          {/* Hamburger for mobile */}
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          {/* Menu items (desktop) */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            {menuItems.map(item => (
              <Button
                key={item.path}
                color={location.pathname === item.path ? 'secondary' : 'inherit'}
                component={Link}
                to={item.path}
                sx={{ fontWeight: location.pathname === item.path ? 700 : 400 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          {/* User Profile Dropdown */}
          <Tooltip title="User menu">
            <Button
              color="inherit"
              onClick={handleProfileMenuOpen}
              endIcon={<ArrowDropDownIcon />}
              sx={{ textTransform: 'none', display: 'flex', alignItems: 'center' }}
            >
              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                {user?.firstName?.[0] || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role}
                </Typography>
              </Box>
            </Button>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }} src={companyLogoUrl} />
              {user?.company || 'Your Company'}
            </MenuItem>
            <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleProfileMenuClose();
                logout();
              }}>
              Logout
            </MenuItem>

          </Menu>
        </Toolbar>
      </AppBar>
      {/* Drawer for mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { sm: 'none' } }}
      >
        <Box sx={{ width: 220 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {menuItems.map(item => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton component={Link} to={item.path}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;