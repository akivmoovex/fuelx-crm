import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  DragIndicator
} from '@mui/icons-material';
import { apiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

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

interface MenuFormData {
  label: string;
  path: string;
  icon: string;
  order: number;
  isActive: boolean;
  parentId?: string;
  roleConfigurations: Array<{
    role: string;
    isVisible: boolean;
    isEnabled: boolean;
    order: number;
  }>;
}

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    label: '',
    path: '',
    icon: '',
    order: 0,
    isActive: true,
    roleConfigurations: []
  });

  const availableIcons = [
    'DashboardIcon',
    'BusinessIcon',
    'PeopleIcon',
    'AccountCircleIcon',
    'AttachMoneyIcon',
    'AssignmentIcon',
    'AssessmentIcon',
    'GroupIcon',
    'SettingsIcon',
    'StorefrontIcon'
  ];

  const userRoles = [
    'SYSTEM_ADMIN',
    'HQ_ADMIN',
    'MARKETING_MANAGER',
    'FINANCE_MANAGER',
    'ACCOUNT_MANAGER',
    'TENANT_ADMIN',
    'SALES_MANAGER',
    'SALES_REP',
    'SUPPORT'
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<MenuItem[]>('/api/menu');
      setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'add' | 'edit', item?: MenuItem) => {
    setDialogMode(mode);
    setSelectedItem(item || null);
    
    if (mode === 'edit' && item) {
      setFormData({
        label: item.label,
        path: item.path,
        icon: item.icon || '',
        order: item.order,
        isActive: item.isActive,
        parentId: item.parentId,
        roleConfigurations: item.roleMenuItems.map(rmi => ({
          role: rmi.role,
          isVisible: rmi.isVisible,
          isEnabled: rmi.isEnabled,
          order: rmi.order
        }))
      });
    } else {
      setFormData({
        label: '',
        path: '',
        icon: '',
        order: 0,
        isActive: true,
        roleConfigurations: userRoles.map(role => ({
          role,
          isVisible: true,
          isEnabled: true,
          order: 0
        }))
      });
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setFormData({
      label: '',
      path: '',
      icon: '',
      order: 0,
      isActive: true,
      roleConfigurations: []
    });
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        await apiClient.post('/api/menu', formData);
      } else {
        await apiClient.put(`/api/menu/${selectedItem?.id}`, formData);
      }
      
      handleCloseDialog();
      fetchMenuItems();
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError('Failed to save menu item');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await apiClient.delete(`/api/menu/${id}`);
        fetchMenuItems();
      } catch (err) {
        console.error('Error deleting menu item:', err);
        setError('Failed to delete menu item');
      }
    }
  };

  const updateRoleConfiguration = (role: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      roleConfigurations: prev.roleConfigurations.map(config =>
        config.role === role ? { ...config, [field]: value } : config
      )
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Menu Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure menu items and their visibility for different user roles.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Menu Items</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Menu Item
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Label</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Role Visibility</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.order}</TableCell>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>{item.path}</TableCell>
                  <TableCell>{item.icon || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Active' : 'Inactive'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {item.roleMenuItems.map((rmi) => (
                        <Chip
                          key={rmi.role}
                          label={rmi.role}
                          size="small"
                          color={rmi.isVisible ? 'primary' : 'default'}
                          icon={rmi.isVisible ? <Visibility /> : <VisibilityOff />}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', item)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Path"
              value={formData.path}
              onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Icon</InputLabel>
              <Select
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                label="Icon"
              >
                <MenuItem value="">None</MenuItem>
                {availableIcons.map(icon => (
                  <MenuItem key={icon} value={icon}>{icon}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
            
            <Typography variant="h6" sx={{ mt: 2 }}>Role Configurations</Typography>
            {formData.roleConfigurations.map((config) => (
              <Box key={config.role} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography sx={{ minWidth: 120 }}>{config.role}</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.isVisible}
                      onChange={(e) => updateRoleConfiguration(config.role, 'isVisible', e.target.checked)}
                    />
                  }
                  label="Visible"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.isEnabled}
                      onChange={(e) => updateRoleConfiguration(config.role, 'isEnabled', e.target.checked)}
                    />
                  }
                  label="Enabled"
                />
                <TextField
                  label="Order"
                  type="number"
                  value={config.order}
                  onChange={(e) => updateRoleConfiguration(config.role, 'order', parseInt(e.target.value) || 0)}
                  sx={{ width: 100 }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement; 