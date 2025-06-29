import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, Person, Email, Phone,
  CheckCircle, Warning, Error, Info, People, Business, Lock, Close
} from '@mui/icons-material';

const roleOptions = [
  'SYSTEM_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'CUSTOMER_SERVICE'
];

const statusOptions = ['active', 'inactive', 'suspended'];

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    businessUnitId: '',
    password: '',
    status: 'active'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName' | 'email' | 'role' | 'createdAt'>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<User[]>('/api/users');
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch business units
    apiClient.get<any[]>('/api/business-units')
      .then(data => {
        setBusinessUnits(data);
      })
      .catch(err => {
        console.error('Error fetching business units:', err);
        // Don't fail the entire page if this fails
      });
  }, []);

  const handleOpen = (mode: 'view' | 'edit' | 'add', user?: User) => {
    setDialogMode(mode);
    setSelectedUser(user || null);
    setFormErrors({}); // Clear previous errors
    
    if (mode === 'add') {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        businessUnitId: '',
        password: '',
        status: 'active'
      });
    } else if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        businessUnitId: user.businessUnitId || '',
        password: '', // Don't populate password for edit
        status: user.status
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
    setSaveLoading(false);
    setFormErrors({}); // Clear errors when closing
  };

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    console.log('Validating form:', form); // Debug log

    if (!form.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!form.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!form.role) {
      errors.role = 'Role is required';
    }

    if (!form.businessUnitId) {
      errors.businessUnitId = 'Business unit is required';
    }

    if (dialogMode === 'add' && !form.password.trim()) {
      errors.password = 'Password is required';
    } else if (dialogMode === 'add' && form.password.trim().length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    console.log('Validation errors:', errors); // Debug log
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fixed save function with validation
  const handleSave = async () => {
    // Validate form before saving
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
      console.log('Saving user:', form); // Debug log

      if (dialogMode === 'edit' && selectedUser) {
        console.log('Updating user:', selectedUser.id);
        await apiClient.put(`/api/users/${selectedUser.id}`, form);
        setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
      } else if (dialogMode === 'add') {
        console.log('Creating new user');
        await apiClient.post('/api/users', form);
        setSnackbar({ open: true, message: 'User added successfully!', severity: 'success' });
      }

      fetchUsers();
      handleClose();
    } catch (error) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save user.',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/api/users/${id}`);
      setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'success' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete user.',
        severity: 'error'
      });
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'error';
      case 'SALES_MANAGER': return 'warning';
      case 'SALES_REP': return 'primary';
      case 'CUSTOMER_SERVICE': return 'info';
      default: return 'default';
    }
  };

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    const nameMatch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower);
    const emailMatch = user.email.toLowerCase().includes(searchLower);
    const roleMatch = user.role.toLowerCase().includes(searchLower);

    return nameMatch || emailMatch || roleMatch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
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
        <Button onClick={fetchUsers} variant="contained">
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
              <People sx={{ mr: 1, verticalAlign: 'middle' }} />
              Users Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your system users and permissions
            </Typography>
          </Box>
          {/* Hide Add User button on mobile for all users */}
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
                Add User
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
              <People sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {users.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Users
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
                {users.filter(u => u.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Users
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
              <Business sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {new Set(users.map(u => u.businessUnitId)).size}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Business Units
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
              <Person sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {users.filter(u => u.role === 'SALES_REP').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Sales Reps
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
              placeholder="Search users..."
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
              onClick={fetchUsers}
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
                      onClick={() => handleSort('firstName')}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Name
                      {sortBy === 'firstName' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('email')}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Email
                      {sortBy === 'email' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleSort('role')}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Role
                      {sortBy === 'role' && (
                        <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>Business Unit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((userItem) => (
                  <TableRow key={userItem.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {userItem.firstName} {userItem.lastName}
                        </Typography>
                        {userItem.phone && (
                          <Typography variant="body2" color="textSecondary">
                            <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {userItem.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">{userItem.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.role.replace('_', ' ')}
                        size="small"
                        color={getRoleColor(userItem.role) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {businessUnits.find(bu => bu.id === userItem.businessUnitId)?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.status}
                        size="small"
                        color={getStatusColor(userItem.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen('view', userItem)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {user?.role === 'SYSTEM_ADMIN' && (
                          <>
                            <Tooltip title="Edit User">
                              <IconButton
                                size="small"
                                onClick={() => handleOpen('edit', userItem)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete User">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(userItem.id)}
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
          {sortedUsers.map((userItem) => (
            <Grid item xs={12} key={userItem.id}>
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
                        {userItem.firstName} {userItem.lastName}
                      </Typography>
                      <Chip
                        label={userItem.role.replace('_', ' ')}
                        size="small"
                        color={getRoleColor(userItem.role) as any}
                        sx={{ fontSize: '0.7rem', mr: 1 }}
                      />
                      <Chip
                        label={userItem.status}
                        size="small"
                        color={getStatusColor(userItem.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      <Email sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {userItem.email}
                    </Typography>
                    {userItem.phone && (
                      <Typography variant="body2" color="textSecondary">
                        <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {userItem.phone}
                      </Typography>
                    )}
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
                        {businessUnits.find(bu => bu.id === userItem.businessUnitId)?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Business Unit
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" gap={1} justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpen('view', userItem)}
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
                          onClick={() => handleOpen('edit', userItem)}
                          startIcon={<Edit />}
                          sx={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(userItem.id)}
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

      {/* User Dialog */}
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
              {dialogMode === 'add' && 'Add New User'}
              {dialogMode === 'edit' && 'Edit User'}
              {dialogMode === 'view' && 'User Details'}
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
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name *"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.firstName}
                    helperText={formErrors.firstName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name *"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.lastName}
                    helperText={formErrors.lastName}
                  />
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
                <Email sx={{ mr: 1, color: 'blue.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'blue.main' }}>
                  Contact Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Assignment Section */}
            <Box sx={{
              mb: 3,
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.role}>
                    <InputLabel>Role *</InputLabel>
                    <Select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      label="Role *"
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="">Select Role</MenuItem>
                      {roleOptions.map(role => (
                        <MenuItem key={role} value={role}>
                          {role.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.role && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {formErrors.role}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.businessUnitId}>
                    <InputLabel>Business Unit *</InputLabel>
                    <Select
                      value={form.businessUnitId}
                      onChange={(e) => setForm({ ...form, businessUnitId: e.target.value })}
                      label="Business Unit *"
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="">Select Business Unit</MenuItem>
                      {businessUnits.map(bu => (
                        <MenuItem key={bu.id} value={bu.id}>
                          {bu.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.businessUnitId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {formErrors.businessUnitId}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Password Section - Only for Add mode */}
            {dialogMode === 'add' && (
              <Box sx={{
                mb: 3,
                p: { xs: 2, md: 3 },
                bgcolor: 'orange.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'orange.200'
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Lock sx={{ mr: 1, color: 'orange.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'orange.main' }}>
                    Security
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password *"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                    />
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
                disabled={saveLoading}
                startIcon={saveLoading ? <CircularProgress size={16} /> : null}
                sx={{ 
                  minWidth: '120px',
                  borderRadius: 2
                }}
              >
                {saveLoading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
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

export default Users;