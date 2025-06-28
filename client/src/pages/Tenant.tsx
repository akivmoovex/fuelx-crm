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
  Business, Edit, Add, Search, Refresh, LocationOn, Email, Phone, 
  CheckCircle, Warning, Error, Info, People, AttachMoney, AccountBalance,
  Visibility, Delete
} from '@mui/icons-material';

interface TenantData {
  id: string;
  name: string;
  type: string;
  status: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  registrationNumber: string;
  taxNumber: string;
  industry: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  accounts?: any[];
  users?: any[];
  businessUnits?: any[];
}

const typeOptions = ['HQ', 'SALES_OFFICE', 'ACCOUNT', 'CUSTOMER'];
const statusOptions = ['active', 'inactive', 'suspended'];

const Tenant: React.FC = () => {
  const { user, tenant } = useAuth();
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
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    registrationNumber: '',
    taxNumber: '',
    industry: '',
    notes: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<TenantData[]>('/api/tenants');
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
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        registrationNumber: '',
        taxNumber: '',
        industry: '',
        notes: ''
      });
      setAddDialogOpen(true);
    } else if (tenant) {
      setForm({
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        postalCode: tenant.postalCode || '',
        country: tenant.country || '',
        phone: tenant.phone || '',
        email: tenant.email || '',
        website: tenant.website || '',
        registrationNumber: tenant.registrationNumber || '',
        taxNumber: tenant.taxNumber || '',
        industry: tenant.industry || '',
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
        await apiClient.post('/api/tenants', form);
        setSnackbar({ open: true, message: 'Tenant added successfully!', severity: 'success' });
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
    const cityMatch = (tenant.city || '').toLowerCase().includes(searchLower);
    const industryMatch = (tenant.industry || '').toLowerCase().includes(searchLower);
    
    return nameMatch || cityMatch || industryMatch;
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
      case 'ACCOUNT': return 'info';
      case 'CUSTOMER': return 'warning';
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
        <Button onClick={fetchTenants} variant="contained">
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
              <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tenant Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your multi-tenant organization structure
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
              Add Tenant
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
                <AccountBalance sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {tenants.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Tenants
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
                    {tenants.filter(t => t.status === 'active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Tenants
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
                    {tenants.reduce((sum, t) => sum + (t.users?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Users
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
                <Business sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {tenants.reduce((sum, t) => sum + (t.accounts?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Accounts
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
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          
          <Button
            startIcon={<Refresh />}
            onClick={fetchTenants}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Tenants Table */}
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
                    Tenant Name
                    {sortBy === 'name' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('type')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Type
                    {sortBy === 'type' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Location</TableCell>
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
                <TableCell>Stats</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {tenant.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {tenant.industry || 'No industry'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.type.replace('_', ' ')}
                      color={getTypeColor(tenant.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {tenant.city && (
                        <Typography variant="body2">
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          {tenant.city}{tenant.state && `, ${tenant.state}`}
                        </Typography>
                      )}
                      {tenant.country && (
                        <Typography variant="caption" color="textSecondary">
                          {tenant.country}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {tenant.email && (
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{tenant.email}</Typography>
                        </Box>
                      )}
                      {tenant.phone && (
                        <Box display="flex" alignItems="center">
                          <Phone sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{tenant.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.status}
                      color={getStatusColor(tenant.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        {tenant.users?.length || 0} users
                      </Typography>
                      <Typography variant="body2">
                        <Business sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        {tenant.accounts?.length || 0} accounts
                      </Typography>
                    </Box>
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
                              onClick={() => handleDelete(tenant.id)}
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

      {/* Tenant Dialog */}
      <Dialog open={editDialogOpen || addDialogOpen || viewDialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {addDialogOpen ? 'Add New Tenant' : 
           editDialogOpen ? 'Edit Tenant' : 'Tenant Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tenant Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={form.type}
                    label="Type"
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    disabled={viewDialogOpen}
                  >
                    {typeOptions.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={viewDialogOpen}
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
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tax Number"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  disabled={viewDialogOpen}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {!viewDialogOpen && (
            <Button onClick={handleSubmit} variant="contained">
              {addDialogOpen ? 'Add Tenant' : 'Update Tenant'}
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

export default Tenant; 