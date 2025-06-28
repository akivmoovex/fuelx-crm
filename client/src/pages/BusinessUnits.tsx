import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessUnit } from '../types';
import { apiClient } from '../utils/api';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, Business, LocationOn, 
  CheckCircle, Warning, Error, Info, People, AttachMoney
} from '@mui/icons-material';

const statusOptions = ['active', 'inactive', 'suspended'];

const BusinessUnits: React.FC = () => {
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
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'city' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any | null>(null);
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

  useEffect(() => {
    apiClient.get<any>('/api/user')
      .then(data => setUser(data))
      .catch(err => console.error('Error fetching user:', err));
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this business unit?')) return;
    
    try {
      await apiClient.delete(`/api/business-units/${id}`);
      setSnackbar({ open: true, message: 'Business unit deleted successfully!', severity: 'success' });
      fetchBusinessUnits();
    } catch (error) {
      console.error('Error deleting business unit:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to delete business unit.', 
        severity: 'error' 
      });
    }
  };

  // Filtering and sorting
  const filteredBusinessUnits = businessUnits.filter(businessUnit => {
    const searchLower = search.toLowerCase();
    const nameMatch = businessUnit.name.toLowerCase().includes(searchLower);
    const locationMatch = businessUnit.location.toLowerCase().includes(searchLower);
    const cityMatch = businessUnit.city.toLowerCase().includes(searchLower);
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || businessUnit.status === statusFilter;
    
    return (nameMatch || locationMatch || cityMatch) && statusMatch;
  });

  const sortedBusinessUnits = [...filteredBusinessUnits].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
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
      setSortDirection('asc');
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
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Modern Header */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
              Business Units Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your business units and locations
            </Typography>
          </Box>
          {user?.role === 'SYSTEM_ADMIN' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen('add')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Add Business Unit
            </Button>
          )}
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Business sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {businessUnits.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Units
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {businessUnits.filter(b => b.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Units
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {users.filter(u => u.businessUnitId).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Assigned Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocationOn sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {new Set(businessUnits.map(b => b.city)).size}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Cities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <MuiTextField
            placeholder="Search business units..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
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
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Business Units Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Button
                    onClick={() => handleSort('name')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Business Unit Name
                    {sortBy === 'name' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('location')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Location
                    {sortBy === 'location' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('city')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    City
                    {sortBy === 'city' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('status')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Status
                    {sortBy === 'status' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBusinessUnits.map((businessUnit) => (
                <TableRow key={businessUnit.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {businessUnit.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {businessUnit.location}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {businessUnit.city}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {businessUnit.email && (
                        <Typography variant="body2">
                          {businessUnit.email}
                        </Typography>
                      )}
                      {businessUnit.phone && (
                        <Typography variant="body2" color="textSecondary">
                          {businessUnit.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={businessUnit.status}
                      color={getStatusColor(businessUnit.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {businessUnit.manager ? `${businessUnit.manager.firstName} ${businessUnit.manager.lastName}` : 'No manager'}
                    </Typography>
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
                      {user?.role === 'SYSTEM_ADMIN' && (
                        <>
                          <Tooltip title="Edit Business Unit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpen('edit', businessUnit)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Business Unit">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(businessUnit.id)}
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

      {/* Business Unit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Business Unit' : 
           dialogMode === 'edit' ? 'Edit Business Unit' : 'Business Unit Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Unit Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    value={form.managerId}
                    label="Manager"
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    disabled={dialogMode === 'view'}
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
                  >
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {dialogMode !== 'view' && user?.role === 'SYSTEM_ADMIN' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'add' ? 'Add Business Unit' : 'Update Business Unit'}
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