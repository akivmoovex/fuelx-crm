import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessUnit, User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, ToggleButtonGroup, ToggleButton, IconButton, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Business, LocationOn, Person } from '@mui/icons-material';

const BusinessUnits: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    managerId: '',
    status: 'active' as const
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'managerId' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get status filter from URL params
  const statusFilter = searchParams.get('status') || 'all';

  // Fetch business units
  const fetchBusinessUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/business-units');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
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

  // Handle opening dialogs
  const handleOpenDialog = (mode: 'view' | 'edit' | 'add', businessUnit?: BusinessUnit) => {
    setDialogMode(mode);
    setSelectedBusinessUnit(businessUnit || null);
    
    if (mode === 'view' && businessUnit) {
      setForm({
        name: businessUnit.name,
        location: businessUnit.location,
        address: businessUnit.address,
        city: businessUnit.city,
        state: businessUnit.state,
        postalCode: businessUnit.postalCode,
        country: businessUnit.country,
        phone: businessUnit.phone,
        email: businessUnit.email,
        managerId: businessUnit.managerId,
        status: businessUnit.status
      });
      setOpen(true);
    } else if (mode === 'edit' && businessUnit) {
      setForm({
        name: businessUnit.name,
        location: businessUnit.location,
        address: businessUnit.address,
        city: businessUnit.city,
        state: businessUnit.state,
        postalCode: businessUnit.postalCode,
        country: businessUnit.country,
        phone: businessUnit.phone,
        email: businessUnit.email,
        managerId: businessUnit.managerId,
        status: businessUnit.status
      });
      setOpen(true);
    } else if (mode === 'add') {
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
        managerId: '',
        status: 'active'
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBusinessUnit(null);
    setDialogMode('add');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (dialogMode === 'edit' && selectedBusinessUnit) {
        const res = await fetch(`/api/business-units/${selectedBusinessUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Business unit updated successfully!', severity: 'success' });
          fetchBusinessUnits();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to update business unit: ${errorData.error}`, severity: 'error' });
        }
      } else if (dialogMode === 'add') {
        const res = await fetch('/api/business-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Business unit added successfully!', severity: 'success' });
          fetchBusinessUnits();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to add business unit: ${errorData.error}`, severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting business unit:', error);
      setSnackbar({ open: true, message: 'An error occurred while saving the business unit.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this business unit?')) return;
    
    try {
      const res = await fetch(`/api/business-units/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Business unit deleted successfully!', severity: 'success' });
        fetchBusinessUnits();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete business unit.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting business unit:', error);
      setSnackbar({ open: true, message: 'An error occurred while deleting the business unit.', severity: 'error' });
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
      case 'active': return '#4caf50';
      case 'inactive': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading business units...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={fetchBusinessUnits} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Business Units ({filteredBusinessUnits.length} of {businessUnits.length})
            {statusFilter !== 'all' && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog('add')}>
            Add Business Unit
          </Button>
        </Box>
        
        {/* Status Filter Toggle Buttons */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(e, newStatus) => newStatus && handleStatusFilterChange(newStatus)}
            aria-label="business unit status filter"
          >
            <ToggleButton value="all" aria-label="all business units">
              All Units
            </ToggleButton>
            <ToggleButton value="active" aria-label="active business units">
              Active
            </ToggleButton>
            <ToggleButton value="inactive" aria-label="inactive business units">
              Inactive
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <TextField
          label="Search Business Units"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        
        {filteredBusinessUnits.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {businessUnits.length === 0 ? 'No business units found' : 'No business units match your search and filter criteria'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                  }}
                >
                  <TableCell
                    onClick={() => handleSort('name')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Name {sortBy === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('location')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Location {sortBy === 'location' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Address</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Contact</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Manager</TableCell>
                  <TableCell
                    onClick={() => handleSort('status')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Status {sortBy === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedBusinessUnits.map(businessUnit => (
                  <TableRow
                    key={businessUnit.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDialog('view', businessUnit)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Business sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1" fontWeight="medium">
                          {businessUnit.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {businessUnit.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {businessUnit.address}, {businessUnit.city}, {businessUnit.state} {businessUnit.postalCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {businessUnit.phone}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {businessUnit.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {businessUnit.managerId ? 
                        users.find(u => u.id === businessUnit.managerId)?.firstName + ' ' + users.find(u => u.id === businessUnit.managerId)?.lastName : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={businessUnit.status.charAt(0).toUpperCase() + businessUnit.status.slice(1)}
                        sx={{
                          backgroundColor: getStatusColor(businessUnit.status),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view', businessUnit)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit business unit">
                          <IconButton size="small" onClick={() => handleOpenDialog('edit', businessUnit)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete business unit">
                          <IconButton size="small" color="error" onClick={() => handleDelete(businessUnit.id)}>
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
        )}
      </Paper>

      {/* Business Unit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {dialogMode === 'view' && selectedBusinessUnit && 'Business Unit Details'}
          {dialogMode === 'edit' && 'Edit Business Unit'}
          {dialogMode === 'add' && 'Add New Business Unit'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            {/* Row 1: Name, Location */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="name"
                label="Business Unit Name"
                value={form.name}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{ 
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <TextField
                name="location"
                label="Location"
                value={form.location}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{ 
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
            </Box>

            {/* Row 2: Address */}
            <TextField
              name="address"
              label="Address"
              value={form.address}
              onChange={handleFormChange}
              required
              fullWidth
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Row 3: City, State, Postal Code */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="city"
                label="City"
                value={form.city}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <TextField
                name="state"
                label="State/Province"
                value={form.state}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <TextField
                name="postalCode"
                label="Postal Code"
                value={form.postalCode}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
            </Box>

            {/* Row 4: Country, Phone */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="country"
                label="Country"
                value={form.country}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <TextField
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
            </Box>

            {/* Row 5: Email, Manager */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                required
                fullWidth
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  name="managerId"
                  value={form.managerId}
                  label="Manager"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="">No Manager</MenuItem>
                  {users.filter(user => user.role === 'manager').map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 6: Status */}
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={form.status}
                label="Status"
                onChange={handleFormChange}
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiSelect-select.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'edit' ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BusinessUnits;