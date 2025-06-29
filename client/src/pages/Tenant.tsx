import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Chip,
  IconButton, Tooltip, TextField as MuiTextField, LinearProgress, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Business, Edit, Add, Search, Refresh,
  CheckCircle, Warning, Error, Info, People, AttachMoney, AccountBalance,
  Visibility, Delete, Close, ContactMail, Assessment
} from '@mui/icons-material';

interface TenantData {
  id: string;
  name: string;
  type: string;
  status: string;
  notes?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  accounts?: any[];
  users?: any[];
  businessUnits?: any[];
}

const typeOptions = ['HQ', 'SALES_OFFICE'];
const statusOptions = ['active', 'inactive', 'suspended'];

const Tenant: React.FC = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [form, setForm] = useState({
    name: '',
    type: 'HQ',
    status: 'active',
    notes: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
  const [formData, setFormData] = useState({
    name: '',
    type: 'HQ',
    status: 'active',
    email: '',
    phone: '',
    address: '',
    website: '',
    industry: '',
    description: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

    if (mode === 'add') {
      setForm({
        name: '',
        type: 'HQ',
        status: 'active',
        notes: ''
      });
      setAddDialogOpen(true);
    } else if (tenant) {
      setForm({
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        notes: tenant.notes || ''
      });

      if (mode === 'view') {
        setViewDialogOpen(true);
      } else {
        setEditDialogOpen(true);
      }
    }
  };

  const handleClose = () => {
    setEditDialogOpen(false);
    setAddDialogOpen(false);
    setViewDialogOpen(false);
    setSelectedTenant(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editDialogOpen && selectedTenant) {
        await apiClient.put(`/api/tenants/${selectedTenant.id}`, form);
        setSnackbar({ open: true, message: 'Tenant updated successfully!', severity: 'success' });
      } else if (addDialogOpen) {
        const newTenant = await apiClient.post('/api/tenants', form);
        setSnackbar({ open: true, message: 'Tenant added successfully!', severity: 'success' });
        console.log('New tenant created:', newTenant);
      }

      fetchTenants();
      handleClose();
    } catch (error) {
      console.error('Error submitting tenant:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while saving the tenant.',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;

    try {
      await apiClient.delete(`/api/tenants/${id}`);
      setSnackbar({ open: true, message: 'Tenant deleted successfully!', severity: 'success' });
      fetchTenants();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete tenant.',
        severity: 'error'
      });
    }
  };

  // Filtering and sorting
  const filteredTenants = tenants.filter(tenant => {
    const searchLower = search.toLowerCase();
    const nameMatch = tenant.name.toLowerCase().includes(searchLower);
    const typeMatch = tenant.type.toLowerCase().includes(searchLower);
    const notesMatch = (tenant.notes || '').toLowerCase().includes(searchLower);

    return nameMatch || typeMatch || notesMatch;
  });

  const sortedTenants = [...filteredTenants].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    if (sortBy === 'createdAt') {
      aValue = aValue || '';
      bValue = bValue || '';
      return sortDirection === 'asc'
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Sorting handler
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection(column === 'createdAt' ? 'desc' : 'asc');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HQ': return 'primary';
      case 'SALES_OFFICE': return 'secondary';
      default: return 'default';
    }
  };

  const handleSave = async () => {
    try {
      if (dialogMode === 'add') {
        await apiClient.post('/api/tenants', formData);
        setSnackbar({ open: true, message: 'Tenant added successfully!', severity: 'success' });
      } else if (dialogMode === 'edit') {
        await apiClient.put(`/api/tenants/${selectedTenant?.id}`, formData);
        setSnackbar({ open: true, message: 'Tenant updated successfully!', severity: 'success' });
      }

      fetchTenants();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving tenant:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while saving the tenant.',
        severity: 'error'
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/tenants/${selectedTenant?.id}`);
      setSnackbar({ open: true, message: 'Tenant deleted successfully!', severity: 'success' });
      fetchTenants();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete tenant.',
        severity: 'error'
      });
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
        <Button onClick={fetchTenants} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ 
      mt: { xs: 0, md: 4 }, 
      px: { xs: 0, md: 2 },
      mx: { xs: 0, md: 'auto' }
    }}>
      {/* Modern Header - Full Width on Mobile */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: { xs: 2, md: 4 }, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        borderRadius: { xs: 0, md: 2 },
        mx: { xs: 0, md: 2 },
        width: { xs: '100vw', md: 'auto' },
        position: { xs: 'relative', md: 'static' },
        left: { xs: '50%', md: 'auto' },
        transform: { xs: 'translateX(-50%)', md: 'none' }
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tenant Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your organization's tenants
            </Typography>
          </Box>
          {/* Hide Add Tenant button on mobile for all users */}
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

      {/* Fully Stretched Stats Cards - Edge to Edge */}
      <Box sx={{ 
        width: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)',
        mb: 4
      }}>
        <Grid container spacing={0} sx={{ width: '100%' }}>
          <Grid item xs={6} sx={{ p: 0 }}>
            <Card sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: { xs: 0, md: 0 },
              mx: 0,
              height: { xs: '140px', md: '160px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              boxShadow: 'none',
              borderRight: { xs: '1px solid rgba(255,255,255,0.2)', md: '1px solid rgba(255,255,255,0.2)' }
            }}>
              <CardContent sx={{ 
                p: { xs: 2, md: 3 }, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%'
              }}>
                <Business sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  mb: 0.5
                }}>
                  {tenants.length}
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}>
                  Total Tenants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sx={{ p: 0 }}>
            <Card sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: { xs: 0, md: 0 },
              mx: 0,
              height: { xs: '140px', md: '160px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              boxShadow: 'none'
            }}>
              <CardContent sx={{ 
                p: { xs: 2, md: 3 }, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%'
              }}>
                <CheckCircle sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  mb: 0.5
                }}>
                  {tenants.filter(t => t.status === 'active').length}
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}>
                  Active Tenants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sx={{ p: 0 }}>
            <Card sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: { xs: 0, md: 0 },
              mx: 0,
              height: { xs: '140px', md: '160px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              boxShadow: 'none',
              borderRight: { xs: '1px solid rgba(255,255,255,0.2)', md: '1px solid rgba(255,255,255,0.2)' },
              borderTop: { xs: '1px solid rgba(255,255,255,0.2)', md: '1px solid rgba(255,255,255,0.2)' }
            }}>
              <CardContent sx={{ 
                p: { xs: 2, md: 3 }, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%'
              }}>
                <People sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  mb: 0.5
                }}>
                  {tenants.reduce((sum, t) => sum + (t.users?.length || 0), 0)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}>
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sx={{ p: 0 }}>
            <Card sx={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: { xs: 0, md: 0 },
              mx: 0,
              height: { xs: '140px', md: '160px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              boxShadow: 'none',
              borderTop: { xs: '1px solid rgba(255,255,255,0.2)', md: '1px solid rgba(255,255,255,0.2)' }
            }}>
              <CardContent sx={{ 
                p: { xs: 2, md: 3 }, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%'
              }}>
                <AccountBalance sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  mb: 0.5
                }}>
                  {tenants.reduce((sum, t) => sum + (t.businessUnits?.length || 0), 0)}
                </Typography>
                <Typography variant="body1" sx={{ 
                  opacity: 0.9, 
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  fontWeight: 500
                }}>
                  Business Units
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Search - Full Width on Mobile */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 3, 
        borderRadius: { xs: 0, md: 3 },
        mx: { xs: 0, md: 2 },
        width: { xs: '100vw', md: 'auto' },
        position: { xs: 'relative', md: 'static' },
        left: { xs: '50%', md: 'auto' },
        transform: { xs: 'translateX(-50%)', md: 'none' }
      }}>
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

      {/* Desktop Table - Card Style */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, px: { xs: 0, md: 2 } }}>
        <Grid container spacing={3}>
          {sortedTenants.map((tenant) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tenant.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleOpen('view', tenant)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
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
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Chip
                      label={tenant.status}
                      size="small"
                      color={getStatusColor(tenant.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  {/* Stats */}
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
                        {tenant.users?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Users
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 1, 
                      bgcolor: 'grey.300', 
                      mx: 1 
                    }} />
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {tenant.businessUnits?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Business Units
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box display="flex" gap={1} justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen('view', tenant);
                      }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen('edit', tenant);
                          }}
                          startIcon={<Edit />}
                          sx={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tenant.id);
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

      {/* Mobile Cards - 2 Columns, Fully Stretched */}
      <Box sx={{ 
        display: { xs: 'block', md: 'none' },
        width: '100vw',
        position: 'relative',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        <Grid container spacing={0} sx={{ width: '100%' }}>
          {sortedTenants.map((tenant) => (
            <Grid item xs={6} key={tenant.id} sx={{ p: 0 }}>
              <Card
                sx={{
                  m: 0,
                  cursor: 'pointer',
                  borderRadius: 0,
                  boxShadow: 'none',
                  background: 'white',
                  height: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'grey.200',
                  '&:nth-child(odd)': {
                    borderRight: '1px solid',
                    borderColor: 'grey.200'
                  },
                  '&:nth-child(even)': {
                    borderRight: 'none'
                  },
                  '&:hover': {
                    backgroundColor: 'grey.50',
                    transition: 'all 0.3s ease'
                  }
                }}
                onClick={() => handleOpen('view', tenant)}
              >
                <CardContent sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  {/* Header */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2
                      }}
                    >
                      {tenant.name}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <Business sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.7rem'
                        }}
                      >
                        {tenant.type.replace('_', ' ')}
                      </Typography>
                    </Box>

                    <Chip
                      label={tenant.status.toUpperCase()}
                      size="small"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        height: 20,
                        backgroundColor: getStatusColor(tenant.status) === 'success' ? '#4caf50' : 
                                      getStatusColor(tenant.status) === 'error' ? '#f44336' : '#ff9800',
                        color: 'white'
                      }}
                    />
                  </Box>

                  {/* Stats */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 'auto',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        fontSize: '0.9rem'
                      }}>
                        {tenant.users?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem' }}>
                        Users
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 1, 
                      bgcolor: 'grey.300', 
                      mx: 0.5 
                    }} />
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 'bold', 
                        color: 'secondary.main',
                        fontSize: '0.9rem'
                      }}>
                        {tenant.businessUnits?.length || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem' }}>
                        Units
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action Button */}
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen('view', tenant);
                    }}
                    startIcon={<Visibility />}
                    sx={{
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      mt: 1,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50',
                        borderColor: 'primary.dark'
                      }
                    }}
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State - Full Width */}
        {sortedTenants.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
              bgcolor: 'white',
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100vw'
            }}
          >
            <Business sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
              No Tenants Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {search
                ? 'Try adjusting your search criteria'
                : 'No tenants are currently available'
              }
            </Typography>
          </Box>
        )}
      </Box>

      {/* Tenant Details Dialog - Centered with Minimal Margins */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '95vw', sm: '90vw', md: '600px' },
            maxWidth: { xs: '95vw', sm: '90vw', md: '600px' },
            margin: { xs: '16px', md: '32px' },
            borderRadius: { xs: 2, md: 3 },
            maxHeight: { xs: '90vh', md: '80vh' }
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: '16px', md: '32px' }
          }
        }}
      >
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
            onClick={() => setDialogOpen(false)}
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
                    label="Tenant Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={dialogMode === 'view'}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                    <MenuItem value="small_business">Small Business</MenuItem>
                    <MenuItem value="startup">Startup</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {/* Contact Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'blue.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'blue.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <ContactMail sx={{ mr: 1, color: 'blue.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'blue.main' }}>
                  Contact Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Additional Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'green.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'green.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Info sx={{ mr: 1, color: 'green.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'green.main' }}>
                  Additional Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Statistics Section (View Mode Only) */}
            {dialogMode === 'view' && selectedTenant && (
              <Box sx={{
                p: { xs: 2, md: 3 },
                bgcolor: 'purple.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'purple.200'
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Assessment sx={{ mr: 1, color: 'purple.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'purple.main' }}>
                    Statistics
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {selectedTenant.users?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'white', borderRadius: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {selectedTenant.businessUnits?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Business Units
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
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
              onClick={() => setDialogOpen(false)}
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
                onClick={() => setDialogOpen(false)}
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

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '90vw', sm: '400px' },
            maxWidth: { xs: '90vw', sm: '400px' },
            margin: { xs: '16px', md: '32px' },
            borderRadius: { xs: 2, md: 3 }
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
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
            onClick={confirmDelete}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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

export default Tenant; 