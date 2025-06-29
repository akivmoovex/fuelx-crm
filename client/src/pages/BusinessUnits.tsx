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
    location: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    status: 'active',
    managerId: '',
    tenantId: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [tenants, setTenants] = useState<any[]>([]);

  // Get filters from URL params
  const statusFilter = searchParams.get('status') || 'all';

  // Fetch business units
  const fetchBusinessUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<BusinessUnit[]>('/api/business-units');
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

    if (mode === 'add') {
      setForm({
        name: '',
        location: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        email: '',
        status: 'active',
        managerId: '',
        tenantId: ''
      });
    } else if (businessUnit) {
      setForm({
        name: businessUnit.name,
        location: businessUnit.location || '',
        address: businessUnit.address || '',
        city: businessUnit.city || '',
        state: businessUnit.state || '',
        postalCode: businessUnit.postalCode || '',
        country: businessUnit.country || '',
        phone: businessUnit.phone || '',
        email: businessUnit.email || '',
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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
      console.error('Error submitting business unit:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while saving the business unit.',
        severity: 'error'
      });
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

  // Filtering
  const filteredBusinessUnits = businessUnits.filter(businessUnit => {
    const searchLower = search.toLowerCase();
    const nameMatch = businessUnit.name.toLowerCase().includes(searchLower);
    const locationMatch = businessUnit.location.toLowerCase().includes(searchLower);
    const cityMatch = businessUnit.city.toLowerCase().includes(searchLower);

    // Apply status filter
    const statusMatch = statusFilter === 'all' || businessUnit.status === statusFilter;

    return (nameMatch || locationMatch || cityMatch) && statusMatch;
  });

  const sortedBusinessUnits = filteredBusinessUnits;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

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
          {hasPermission('business_units:write') && (
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

      {/* Desktop Table */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper sx={{ overflow: 'hidden', borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBusinessUnits.map((businessUnit) => (
                  <TableRow key={businessUnit.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {businessUnit.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{businessUnit.location}</TableCell>
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
                        {hasPermission('business_units:write') && (
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
                        {hasPermission('business_units:delete') && (
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
        {sortedBusinessUnits.map((businessUnit) => (
          <Card
            key={businessUnit.id}
            sx={{
              mb: 2,
              cursor: 'pointer',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}
            onClick={() => handleOpen('view', businessUnit)}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Header with Status Badge */}
              <Box sx={{
                p: 2.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px 12px 0 0'
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1} minWidth={0}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {businessUnit.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationOn sx={{ fontSize: 16, opacity: 0.9 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.9,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {businessUnit.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={businessUnit.status.toUpperCase()}
                    size="small"
                    sx={{
                      ml: 1,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      height: 24,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>

              {/* Content Section */}
              <Box sx={{ p: 2.5 }}>
                {/* Key Information Cards */}
                <Grid container spacing={1.5} mb={2}>
                  <Grid item xs={6}>
                    <Box sx={{
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
                        City
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {businessUnit.city || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
                        Manager
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {businessUnit.manager ? `${businessUnit.manager.firstName} ${businessUnit.manager.lastName}` : 'No manager'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Contact Information */}
                {(businessUnit.email || businessUnit.phone) && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'primary.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}
                  >
                    <Typography variant="caption" color="primary.main" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                      Contact Information
                    </Typography>
                    {businessUnit.email && (
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>✉️</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {businessUnit.email}
                        </Typography>
                      </Box>
                    )}
                    {businessUnit.phone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>📞</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {businessUnit.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Action Buttons */}
                <Box
                  display="flex"
                  gap={1}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpen('view', businessUnit)}
                    startIcon={<Visibility />}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    View
                  </Button>
                  {hasPermission('business_units:write') && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpen('edit', businessUnit)}
                      startIcon={<Edit />}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {hasPermission('business_units:delete') && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleDelete(businessUnit.id)}
                      startIcon={<Delete />}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'error.main',
                        color: 'error.main'
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {sortedBusinessUnits.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              bgcolor: 'rgba(255,255,255,0.8)',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'grey.300'
            }}
          >
            <Business sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
              No Business Units Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first business unit'
              }
            </Typography>
          </Box>
        )}
      </Box>

      {/* Business Unit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{
          background: dialogMode === 'view' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'primary.main',
          color: 'white',
          pb: 2
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Business sx={{ mr: 2, fontSize: 28 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {dialogMode === 'add' ? 'Add New Business Unit' :
                    dialogMode === 'edit' ? 'Edit Business Unit' : 'Business Unit Details'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {dialogMode === 'add' ? 'Create a new business unit for your organization' :
                    dialogMode === 'edit' ? 'Update business unit information' :
                      'View complete business unit information'}
                </Typography>
              </Box>
            </Box>
            {dialogMode === 'view' && (
              <Chip
                label={form.status}
                color={getStatusColor(form.status) as any}
                sx={{ color: 'white', fontWeight: 'bold' }}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(102, 126, 234, 0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Business Unit Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black', fontWeight: 'bold' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      label="Status"
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      disabled={dialogMode === 'view'}
                      sx={dialogMode === 'view' ? {
                        '& .MuiSelect-select': { color: 'black', fontWeight: 'bold' },
                        '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                          '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                        }
                      } : {}}
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
            </Paper>

            {/* Location Information Section */}
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(76, 175, 80, 0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'success.main' }}>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={3}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Contact Information Section */}
            <Paper sx={{ p: 3, mb: 3, background: 'rgba(255, 152, 0, 0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'warning.main' }}>
                <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
                Contact Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={dialogMode === 'view'}
                    sx={dialogMode === 'view' ? {
                      '& .MuiInputBase-input': { color: 'black' },
                      '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                        '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                      }
                    } : {}}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Management Information Section */}
            <Paper sx={{ p: 3, background: 'rgba(156, 39, 176, 0.05)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'secondary.main' }}>
                <People sx={{ mr: 1, verticalAlign: 'middle' }} />
                Management Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Manager</InputLabel>
                    <Select
                      value={form.managerId}
                      label="Manager"
                      onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                      disabled={dialogMode === 'view'}
                      sx={dialogMode === 'view' ? {
                        '& .MuiSelect-select': { color: 'black' },
                        '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                          '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                        }
                      } : {}}
                    >
                      <MenuItem value="">No manager</MenuItem>
                      {users.map(user => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tenant</InputLabel>
                    <Select
                      value={form.tenantId}
                      label="Tenant"
                      onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                      disabled={dialogMode === 'view'}
                      sx={dialogMode === 'view' ? {
                        '& .MuiSelect-select': { color: 'black' },
                        '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.7)' },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                          '&:hover fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' }
                        }
                      } : {}}
                    >
                      {tenants.map(tenant => (
                        <MenuItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.type})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          {dialogMode !== 'view' && (
            <Button onClick={handleClose} disabled={loading} variant="outlined">
              Cancel
            </Button>
          )}
          {dialogMode !== 'view' && hasPermission('business_units:write') && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? 'Saving...' : (dialogMode === 'add' ? 'Add Business Unit' : 'Update Business Unit')}
            </Button>
          )}
          {dialogMode === 'view' && (
            <Button onClick={handleClose} variant="contained" startIcon={<Close />}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default BusinessUnits;