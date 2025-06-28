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
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  { 
    label: 'Dashboard', 
    path: '/dashboard',
    icon: <DashboardIcon />
  },
  { 
    label: 'Tenant', 
    path: '/tenant',
    icon: <StorefrontIcon />
  },
  { 
    label: 'Accounts', 
    path: '/accounts',
    icon: <AccountCircleIcon />
  },
  { 
    label: 'Customers', 
    path: '/customers',
    icon: <GroupIcon />
  },
  { 
    label: 'Business Units', 
    path: '/business-units',
    icon: <BusinessIcon />
  },
  { 
    label: 'Users', 
    path: '/users',
    icon: <PeopleIcon />
  },
  { 
    label: 'Deals', 
    path: '/deals',
    icon: <AttachMoneyIcon />
  },
  { 
    label: 'Tasks', 
    path: '/tasks',
    icon: <AssignmentIcon />
  }
];

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
                startIcon={item.icon}
                sx={{ 
                  fontWeight: location.pathname === item.path ? 700 : 400,
                  minWidth: 'auto',
                  px: 2
                }}
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
              {user?.tenant?.name || 'Your Company'}
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
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { sm: 'none' } }}
      >
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.path}>
                <ListItem disablePadding>
                  <ListItemButton 
                    component={Link} 
                    to={item.path}
                    selected={location.pathname === item.path}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }
                    }}
                  >
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      {item.icon}
                    </Box>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
                {index === 2 && <Divider />} {/* Add divider after Tenant */}
                {index === 4 && <Divider />} {/* Add divider after Business Units */}
              </React.Fragment>
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