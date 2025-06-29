import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BusinessUnit } from '../types';
import { apiClient } from '../utils/api';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, Business, LocationOn,
  CheckCircle, Warning, Error, Info, People, AttachMoney, Phone, Close
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const statusOptions = ['active', 'inactive', 'suspended'];

const BusinessUnits: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Zambia', // Default to Zambia
    status: 'active',
    managerId: '',
    tenantId: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenants, setTenants] = useState<any[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Get filters from URL params
  const statusFilter = searchParams.get('status') || 'all';

  // Debug: Log user and permissions
  useEffect(() => {
    console.log('Current user:', user);
    console.log('User permissions:', user?.permissions);
    console.log('Has business-units:write permission:', hasPermission('business-units:write'));
    console.log('User role:', user?.role);
  }, [user, hasPermission]);

  // Fetch business units
  const fetchBusinessUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<BusinessUnit[]>('/api/business-units');
      console.log('Fetched business units:', data);
      setBusinessUnits(data);
    } catch (err) {
      console.error('Error fetching business units:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  useEffect(() => {
    // Fetch users and tenants
    Promise.all([
      apiClient.get<any[]>('/api/users'),
      apiClient.get<any[]>('/api/tenants')
    ]).then(([usersData, tenantsData]) => {
      setUsers(usersData);
      setTenants(tenantsData);
    }).catch(err => console.error('Error fetching data:', err));
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    if (newStatus === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newStatus);
    }
    setSearchParams(searchParams);
  };

  const handleOpen = (mode: 'view' | 'edit' | 'add', businessUnit?: BusinessUnit) => {
    setDialogMode(mode);
    setSelectedBusinessUnit(businessUnit || null);
    setFormErrors({});

    if (mode === 'add') {
      setForm({
        name: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Zambia', // Default to Zambia
        status: 'active',
        managerId: '',
        tenantId: user?.tenantId || ''
      });
    } else if (businessUnit) {
      setForm({
        name: businessUnit.name,
        address: businessUnit.address || '',
        city: businessUnit.city || '',
        state: businessUnit.state || '',
        postalCode: businessUnit.postalCode || '',
        country: businessUnit.country || 'Zambia',
        status: businessUnit.status,
        managerId: businessUnit.managerId || '',
        tenantId: businessUnit.tenantId || ''
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBusinessUnit(null);
    setSaveLoading(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!form.name.trim()) errors.name = 'Business unit name is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State/Province is required';
    if (!form.country.trim()) errors.country = 'Country is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fixed save function
  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly.',
        severity: 'error'
      });
      return;
    }

    try {
      setSaveLoading(true);
      console.log('Saving business unit:', form);

      if (dialogMode === 'edit' && selectedBusinessUnit) {
        await apiClient.put(`/api/business-units/${selectedBusinessUnit.id}`, form);
        setSnackbar({ open: true, message: 'Business unit updated successfully!', severity: 'success' });
      } else if (dialogMode === 'add') {
        await apiClient.post('/api/business-units', form);
        setSnackbar({ open: true, message: 'Business unit added successfully!', severity: 'success' });
      }

      fetchBusinessUnits();
      handleClose();
    } catch (error) {
      console.error('Error saving business unit:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while saving the business unit.',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Add this new function for refreshing without loading state
  const refreshBusinessUnits = async () => {
    try {
      const data = await apiClient.get<BusinessUnit[]>('/api/business-units');
      setBusinessUnits(data);
    } catch (err) {
      console.error('Error refreshing business units:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh business units');
    }
  };

  // Update the handleDelete function
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this business unit?')) return;

    try {
      setLoading(true);
      await apiClient.delete(`/api/business-units/${id}`);

      // If we reach here, the delete was successful
      setSnackbar({ open: true, message: 'Business unit deleted successfully!', severity: 'success' });

      // Close any open dialogs first
      handleClose();

      // Refresh the business units list without showing loading state
      await refreshBusinessUnits();
    } catch (error: any) {
      console.error('Error deleting business unit:', error);

      let errorMessage = 'Failed to delete business unit.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
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

  // Filter and sort business units - FIXED LOGIC
  const filteredBusinessUnits = businessUnits.filter(businessUnit => {
    // First apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      const nameMatch = businessUnit.name.toLowerCase().includes(searchLower);
      const cityMatch = (businessUnit.city || '').toLowerCase().includes(searchLower);
      const statusMatch = businessUnit.status.toLowerCase().includes(searchLower);

      if (!nameMatch && !cityMatch && !statusMatch) {
        return false;
      }
    }

    // Then apply status filter
    if (statusFilter !== 'all' && businessUnit.status !== statusFilter) {
      return false;
    }

    return true;
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
        <Button onClick={fetchBusinessUnits} variant="contained">
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
              Business Units Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your business units and locations
            </Typography>
          </Box>
          {/* Debug info */}
          <Box sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
            <div>Role: {user?.role}</div>
            <div>Has Write: {hasPermission('business-units:write') ? 'Yes' : 'No'}</div>
            <div>Permissions: {user?.permissions?.join(', ') || 'None'}</div>
          </Box>
          {/* Show button for SYSTEM_ADMIN or users with permission */}
          {(user?.role === 'SYSTEM_ADMIN' || hasPermission('business-units:write')) && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen('add')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              Add Business Unit
            </Button>
          )}
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
                {businessUnits.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Units
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
                {businessUnits.filter(b => b.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Units
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
                {users.filter(u => u.businessUnitId).length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Assigned Users
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
              <LocationOn sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {new Set(businessUnits.map(b => b.city)).size}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Cities
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search business units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: { xs: '100%', sm: 300 } }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            startIcon={<Refresh />}
            onClick={fetchBusinessUnits}
            variant="outlined"
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Debug info */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.8rem' }}>
        <div>Total Business Units: {businessUnits.length}</div>
        <div>Filtered Results: {filteredBusinessUnits.length}</div>
        <div>Search Term: "{search}"</div>
        <div>Status Filter: {statusFilter}</div>
      </Box>

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBusinessUnits.map((businessUnit) => (
                  <TableRow key={businessUnit.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {businessUnit.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{businessUnit.address || 'No address'}</TableCell>
                    <TableCell>{businessUnit.city}</TableCell>
                    <TableCell>
                      <Chip
                        label={businessUnit.status}
                        color={getStatusColor(businessUnit.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {businessUnit.manager ? `${businessUnit.manager.firstName} ${businessUnit.manager.lastName}` : 'No manager'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen('view', businessUnit)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {(user?.role === 'SYSTEM_ADMIN' || hasPermission('business-units:write')) && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpen('edit', businessUnit)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(user?.role === 'SYSTEM_ADMIN' || hasPermission('business-units:write')) && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(businessUnit.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
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
          {filteredBusinessUnits.map((businessUnit) => (
            <Grid item xs={12} key={businessUnit.id}>
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
                        {businessUnit.name}
                      </Typography>
                      <Chip
                        label={businessUnit.status}
                        size="small"
                        color={getStatusColor(businessUnit.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {businessUnit.address && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {businessUnit.address}
                      </Typography>
                    )}
                    <Typography variant="body2" color="textSecondary">
                      {businessUnit.city}, {businessUnit.state}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpen('view', businessUnit)}
                      startIcon={<Visibility />}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    {(user?.role === 'SYSTEM_ADMIN' || hasPermission('business-units:write')) && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpen('edit', businessUnit)}
                          startIcon={<Edit />}
                          sx={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(businessUnit.id)}
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

      {/* Empty State */}
      {filteredBusinessUnits.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8, 
          px: 2,
          bgcolor: 'grey.50',
          borderRadius: 3
        }}>
          <Business sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, color: 'grey.600' }}>
            {search || statusFilter !== 'all'
              ? 'No business units found'
              : 'No business units yet'
            }
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first business unit'
            }
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Business Unit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
              {dialogMode === 'add' && 'Add New Business Unit'}
              {dialogMode === 'edit' && 'Edit Business Unit'}
              {dialogMode === 'view' && 'Business Unit Details'}
            </Typography>
            {dialogMode === 'view' && (
              <Chip
                label={form.status.toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(form.status) === 'success' ? '#4caf50' : 
                                getStatusColor(form.status) === 'error' ? '#f44336' : '#ff9800',
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
          {/* Basic Information */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              mb: 2,
              display: 'flex',
              alignItems: 'center'
            }}>
              <Business sx={{ mr: 1 }} />
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Unit Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Location Information */}
          <Box sx={{
            mb: 3,
            p: { xs: 2, md: 3 },
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Location Information
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address (Optional)"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={dialogMode === 'view'}
                  multiline
                  rows={2}
                  helperText="Street address is optional"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City *"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State/Province *"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.state}
                  helperText={formErrors.state}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country *"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.country}
                  helperText={formErrors.country}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Assignment Information */}
          <Box sx={{
            p: { xs: 2, md: 3 },
            bgcolor: 'green.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'green.200'
          }}>
            <Box display="flex" alignItems="center" mb={2}>
              <People sx={{ mr: 1, color: 'green.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'green.main' }}>
                Assignment
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    value={form.managerId}
                    label="Manager"
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="">No Manager</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tenant</InputLabel>
                  <Select
                    value={form.tenantId}
                    label="Tenant"
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="">No Tenant</MenuItem>
                    {tenants.map(tenant => (
                      <MenuItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button onClick={handleClose} disabled={saveLoading}>
            Cancel
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saveLoading}
              startIcon={saveLoading ? <CircularProgress size={20} /> : null}
            >
              {saveLoading ? 'Saving...' : dialogMode === 'add' ? 'Add Business Unit' : 'Update Business Unit'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BusinessUnits;