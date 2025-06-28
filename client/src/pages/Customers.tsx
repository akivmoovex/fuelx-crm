import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip
} from '@mui/material';

const statusOptions = ['lead', 'prospect', 'customer', 'inactive'];
const sourceOptions = ['website', 'referral', 'cold-call', 'social-media', 'other'];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead',
    source: '',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'firstName' | 'lastName' | 'company' | 'status'>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle opening dialogs
  const handleOpenDialog = (mode: 'view' | 'edit' | 'add', customer?: Customer) => {
    setDialogMode(mode);
    setSelectedCustomer(customer || null);
    
    if (mode === 'view' && customer) {
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company,
        status: customer.status,
        source: customer.source,
        notes: customer.notes
      });
      setOpen(true);
    } else if (mode === 'edit' && customer) {
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company,
        status: customer.status,
        source: customer.source,
        notes: customer.notes
      });
      setOpen(true);
    } else if (mode === 'add') {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        status: 'lead',
        source: '',
        notes: ''
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCustomer(null);
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
      if (dialogMode === 'edit' && selectedCustomer) {
        const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Customer updated successfully!', severity: 'success' });
          fetchCustomers();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to update customer: ${errorData.error}`, severity: 'error' });
        }
      } else if (dialogMode === 'add') {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Customer added successfully!', severity: 'success' });
          fetchCustomers();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to add customer: ${errorData.error}`, severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting customer:', error);
      setSnackbar({ open: true, message: 'An error occurred while saving the customer.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Customer deleted successfully!', severity: 'success' });
        fetchCustomers();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete customer.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      setSnackbar({ open: true, message: 'An error occurred while deleting the customer.', severity: 'error' });
    }
  };

  // Filtering and sorting
  const filteredCustomers = customers.filter(customer => {
    const searchLower = search.toLowerCase();
    const nameMatch = `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchLower);
    const companyMatch = customer.company.toLowerCase().includes(searchLower);
    const emailMatch = (customer.email || '').toLowerCase().includes(searchLower);
    
    return nameMatch || companyMatch || emailMatch;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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
      case 'lead': return '#ff9800';
      case 'prospect': return '#2196f3';
      case 'customer': return '#4caf50';
      case 'inactive': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading customers...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={fetchCustomers} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Customers ({filteredCustomers.length} of {customers.length})</Typography>
          <Button variant="contained" onClick={() => handleOpenDialog('add')}>Add Customer</Button>
        </Box>
        
        <TextField
          label="Search Customers"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        
        {filteredCustomers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {customers.length === 0 ? 'No customers found' : 'No customers match your search'}
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
                    onClick={() => handleSort('firstName')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Name {sortBy === 'firstName' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Company</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell
                    onClick={() => handleSort('status')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Status {sortBy === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Source</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCustomers.map(customer => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDialog('view', customer)}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {customer.firstName} {customer.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        sx={{
                          backgroundColor: getStatusColor(customer.status),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>{customer.source || '-'}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button size="small" onClick={() => handleOpenDialog('edit', customer)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(customer.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Customer Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {dialogMode === 'view' && selectedCustomer && 'Customer Details'}
          {dialogMode === 'edit' && 'Edit Customer'}
          {dialogMode === 'add' && 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            {/* Row 1: First Name, Last Name */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="firstName"
                label="First Name"
                value={form.firstName}
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
                name="lastName"
                label="Last Name"
                value={form.lastName}
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

            {/* Row 2: Email, Phone */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
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

            {/* Row 3: Company */}
            <TextField
              name="company"
              label="Company"
              value={form.company}
              onChange={handleFormChange}
              required
              fullWidth
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 5,
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Row 4: Status, Source */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleFormChange}
                  required
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  name="source"
                  value={form.source}
                  label="Source"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="">Select Source</MenuItem>
                  {sourceOptions.map(source => (
                    <MenuItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 5: Notes */}
            <TextField
              name="notes"
              label="Notes"
              value={form.notes}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Only show action buttons for edit/add modes */}
            {(dialogMode === 'edit' || dialogMode === 'add') && (
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained">
                  {dialogMode === 'edit' ? 'Update' : 'Add'}
                </Button>
              </DialogActions>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Customers;