import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
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
import { apiClient } from '../utils/api';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  order: number;
  isActive: boolean;
  parentId?: string;
  children?: MenuItem[];
  roleMenuItems: Array<{
    role: string;
    isVisible: boolean;
    isEnabled: boolean;
    order: number;
  }>;
}

interface DynamicMenuProps {
  variant: 'desktop' | 'mobile';
  onItemClick?: () => void;
}

// Icon mapping
const iconMap: { [key: string]: React.ReactElement } = {
  'DashboardIcon': <DashboardIcon />,
  'BusinessIcon': <BusinessIcon />,
  'PeopleIcon': <PeopleIcon />,
  'AccountCircleIcon': <AccountCircleIcon />,
  'AttachMoneyIcon': <AttachMoneyIcon />,
  'AssignmentIcon': <AssignmentIcon />,
  'AssessmentIcon': <AssessmentIcon />,
  'GroupIcon': <GroupIcon />,
  'SettingsIcon': <SettingsIcon />,
  'StorefrontIcon': <StorefrontIcon />
};

const DynamicMenu: React.FC<DynamicMenuProps> = ({ variant, onItemClick }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching menu items from API...');
      const data = await apiClient.get<MenuItem[]>('/api/menu/my-menu');
      console.log('Menu API response:', data);
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu');
      // Fallback to default menu items
      console.log('Using fallback menu items');
      setMenuItems(getDefaultMenuItems());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultMenuItems = (): MenuItem[] => {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: 'DashboardIcon',
        order: 0,
        isActive: true,
        roleMenuItems: []
      },
      {
        id: 'deals',
        label: 'Deals',
        path: '/deals',
        icon: 'AttachMoneyIcon',
        order: 1,
        isActive: true,
        roleMenuItems: []
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: 'GroupIcon',
        order: 2,
        isActive: true,
        roleMenuItems: []
      },
      {
        id: 'tasks',
        label: 'Tasks',
        path: '/tasks',
        icon: 'AssignmentIcon',
        order: 3,
        isActive: true,
        roleMenuItems: []
      }
    ];
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const icon = item.icon ? iconMap[item.icon] : null;
    const isSelected = location.pathname === item.path;

    if (variant === 'desktop') {
      return (
        <Button
          key={item.id}
          color={isSelected ? 'secondary' : 'inherit'}
          component={Link}
          to={item.path}
          startIcon={icon}
          onClick={onItemClick}
          sx={{ 
            fontWeight: isSelected ? 700 : 400,
            minWidth: 'auto',
            px: 2,
            ml: isChild ? 2 : 0
          }}
        >
          {item.label}
        </Button>
      );
    }

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton 
            component={Link} 
            to={item.path}
            selected={isSelected}
            onClick={onItemClick}
            sx={{
              pl: isChild ? 4 : 2,
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
              {icon}
            </Box>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
        {item.children && item.children.length > 0 && (
          <>
            {item.children.map(child => renderMenuItem(child, true))}
            <Divider />
          </>
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (variant === 'desktop') {
    return (
      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </Box>
    );
  }

  return (
    <List>
      {menuItems.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderMenuItem(item)}
          {index < menuItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default DynamicMenu; 