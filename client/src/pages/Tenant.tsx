import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import { Navigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Chip,
  IconButton, Tooltip, LinearProgress, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Business, Edit, Add, Search, Refresh,
  CheckCircle, Warning, Error, Info, People, AttachMoney, AccountBalance,
  Visibility, Delete, Close, LocationOn, Description
} from '@mui/icons-material';

interface TenantData {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  users?: number;
  businessUnits?: number;
  accounts?: number;
}

const typeOptions = ['HQ', 'SALES_OFFICE'];
const statusOptions = ['active', 'inactive', 'suspended'];

const Tenant: React.FC = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState({
    name: '',
    type: 'SALES_OFFICE',
    status: 'active',
    description: ''
  });

  // Role-based access control - only SYSTEM_ADMIN can access Tenant page
  if (user?.role !== 'SYSTEM_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<TenantData[]>('/api/tenants');
      console.log('Fetched tenants:', data);
      setTenants(data);
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (mode: 'view' | 'edit' | 'add', tenant?: TenantData) => {
    setSelectedTenant(tenant || null);
    setDialogMode(mode);
    setFormErrors({});

    if (mode === 'add') {
      setForm({
        name: '',
        type: 'SALES_OFFICE',
        status: 'active',
        description: ''
      });
    } else if (tenant) {
      setForm({
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        description: tenant.description || ''
      });
    }

    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedTenant(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!form.name.trim()) {
      errors.name = 'Tenant name is required';
    }

    if (!form.type) {
      errors.type = 'Type is required';
    }

    if (!form.status) {
      errors.status = 'Status is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage('Please fill in all required fields correctly.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setLoading(true);
      if (dialogMode === 'add') {
        await apiClient.post('/api/tenants', form);
        setSnackbarMessage('Tenant added successfully!');
        setSnackbarSeverity('success');
      } else if (dialogMode === 'edit' && selectedTenant) {
        await apiClient.put(`/api/tenants/${selectedTenant.id}`, form);
        setSnackbarMessage('Tenant updated successfully!');
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
      setDialogOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error saving tenant:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to save tenant');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/api/tenants/${selectedTenant.id}`);
      setSnackbarMessage('Tenant deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      setDialogOpen(false);
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to delete tenant');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HQ': return 'primary';
      case 'SALES_OFFICE': return 'secondary';
      default: return 'default';
    }
  };

  // Filter and sort tenants
  const filteredTenants = tenants.filter(tenant => {
    const searchLower = search.toLowerCase();
    const nameMatch = tenant.name.toLowerCase().includes(searchLower);
    const typeMatch = tenant.type.toLowerCase().includes(searchLower);
    const descriptionMatch = (tenant.description || '').toLowerCase().includes(searchLower);

    return nameMatch || typeMatch || descriptionMatch;
  });

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <LinearProgress />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchTenants} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 } }}>
      {/* Modern Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: { xs: 2, md: 4 }, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: { xs: 0, md: 2 }
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tenant Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your organization's tenants and locations
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {user?.role === 'SYSTEM_ADMIN' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpen('add')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Add Tenant
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <Business sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Tenants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.filter(t => t.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Tenants
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <People sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.reduce((sum, t) => sum + (t.users || 0), 0)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
              <AccountBalance sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {tenants.reduce((sum, t) => sum + (t.businessUnits || 0), 0)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Business Units
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchTenants}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setSortBy('name');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Name
                      {sortBy === 'name' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setSortBy('type');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Type
                      {sortBy === 'type' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => {
                        setSortBy('status');
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      }}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Status
                      {sortBy === 'status' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Business Units</TableCell>
                  <TableCell>Accounts</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTenants.map((tenant) => (
                  <TableRow key={tenant.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {tenant.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.type.replace('_', ' ')}
                        size="small"
                        color={getTypeColor(tenant.type) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status}
                        size="small"
                        color={getStatusColor(tenant.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {tenant.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.users || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.businessUnits || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {tenant.accounts || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen('view', tenant)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {user?.role === 'SYSTEM_ADMIN' && (
                          <>
                            <Tooltip title="Edit Tenant">
                              <IconButton
                                size="small"
                                onClick={() => handleOpen('edit', tenant)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Tenant">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setDeleteDialogOpen(true);
                                }}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Grid container spacing={2}>
          {sortedTenants.map((tenant) => (
            <Grid item xs={12} key={tenant.id}>
              <Card sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1} minWidth={0}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'bold',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tenant.name}
                      </Typography>
                      <Chip
                        label={tenant.type.replace('_', ' ')}
                        size="small"
                        color={getTypeColor(tenant.type) as any}
                        sx={{ fontSize: '0.7rem', mr: 1 }}
                      />
                      <Chip
                        label={tenant.status}
                        size="small"
                        color={getStatusColor(tenant.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      {tenant.description || 'No description'}
                    </Typography>
                  </Box>

                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {tenant.users || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Users
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {tenant.businessUnits || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Business Units
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {tenant.accounts || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Accounts
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpen('view', tenant)}
                      startIcon={<Visibility />}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    {user?.role === 'SYSTEM_ADMIN' && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpen('edit', tenant)}
                          startIcon={<Edit />}
                          sx={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setDeleteDialogOpen(true);
                          }}
                          startIcon={<Delete />}
                          sx={{ flex: 1 }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tenant Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 2, md: 3 }
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {dialogMode === 'add' && 'Add New Tenant'}
              {dialogMode === 'edit' && 'Edit Tenant'}
              {dialogMode === 'view' && 'Tenant Details'}
            </Typography>
            {dialogMode === 'view' && selectedTenant && (
              <Chip
                label={selectedTenant.status.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(selectedTenant.status) === 'success' ? '#4caf50' : 
                                getStatusColor(selectedTenant.status) === 'error' ? '#f44336' : '#ff9800',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ maxHeight: { xs: '60vh', md: '50vh' }, overflowY: 'auto' }}>
            {/* Basic Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tenant Name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    placeholder="Enter tenant name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.type}>
                    <InputLabel>Type *</InputLabel>
                    <Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      label="Type *"
                      disabled={dialogMode === 'view'}
                    >
                      {typeOptions.map(type => (
                        <MenuItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {formErrors.type}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.status}>
                    <InputLabel>Status *</InputLabel>
                    <Select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      label="Status *"
                      disabled={dialogMode === 'view'}
                    >
                      {statusOptions.map(status => (
                        <MenuItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.status && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {formErrors.status}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Description Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'blue.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'blue.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Description sx={{ mr: 1, color: 'blue.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'blue.main' }}>
                  Description
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={3}
                    placeholder="Enter tenant description (optional)"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: { xs: 2, md: 3 },
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'grey.200'
        }}>
          {dialogMode === 'view' ? (
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{ 
                minWidth: '120px',
                borderRadius: 2
              }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{ 
                  minWidth: '100px',
                  borderRadius: 2
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
                sx={{ 
                  minWidth: '120px',
                  borderRadius: 2
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tenant? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Tenant; 