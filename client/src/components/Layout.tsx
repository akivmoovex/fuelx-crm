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
  Tooltip,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import DynamicMenu from './DynamicMenu';

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

  const handleDrawerClose = () => {
    setDrawerOpen(false);
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
          {/* Dynamic Menu items (desktop) */}
          <DynamicMenu variant="desktop" />
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
              {user?.tenantId || 'Your Company'}
            </MenuItem>
            <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              My Profile
            </MenuItem>
            <MenuItem component={Link} to="/reports" onClick={handleProfileMenuClose}>
              <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} />
              My Reports
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
        onClose={handleDrawerClose}
        sx={{ display: { sm: 'none' } }}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <DynamicMenu variant="mobile" onItemClick={handleDrawerClose} />
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;