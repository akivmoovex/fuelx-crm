import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Account, BusinessUnit, User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, ToggleButtonGroup, ToggleButton, IconButton, Tooltip, Avatar
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Business, Person, AccountCircle, AttachMoney } from '@mui/icons-material';

const Accounts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'company' as const,
    registrationNumber: '',
    taxNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    status: 'active' as const,
    businessUnitId: '',
    accountManagerId: '',
    creditLimit: '',
    paymentTerms: '',
    industry: '',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'businessUnitId' | 'status'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Get filters from URL params
  const statusFilter = searchParams.get('status') || 'all';
  const typeFilter = searchParams.get('type') || 'all';

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    // Fetch business units and users
    Promise.all([
      fetch('/api/business-units').then(res => res.json()),
      fetch('/api/users').then(res => res.json())
    ]).then(([businessUnitsData, usersData]) => {
      setBusinessUnits(businessUnitsData);
      setUsers(usersData);
    }).catch(err => console.error('Error fetching data:', err));
  }, []);

  // Handle filter changes
  const handleStatusFilterChange = (newStatus: string) => {
    if (newStatus === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newStatus);
    }
    setSearchParams(searchParams);
  };

  const handleTypeFilterChange = (newType: string) => {
    if (newType === 'all') {
      searchParams.delete('type');
    } else {
      searchParams.set('type', newType);
    }
    setSearchParams(searchParams);
  };

  // Handle opening dialogs
  const handleOpenDialog = (mode: 'view' | 'edit' | 'add', account?: Account) => {
    setDialogMode(mode);
    setSelectedAccount(account || null);
    
    if (mode === 'view' && account) {
      setForm({
        name: account.name,
        type: account.type,
        registrationNumber: account.registrationNumber || '',
        taxNumber: account.taxNumber || '',
        address: account.address,
        city: account.city,
        state: account.state,
        postalCode: account.postalCode,
        country: account.country,
        phone: account.phone,
        email: account.email,
        website: account.website || '',
        status: account.status,
        businessUnitId: account.businessUnitId,
        accountManagerId: account.accountManagerId,
        creditLimit: account.creditLimit.toString(),
        paymentTerms: account.paymentTerms,
        industry: account.industry,
        notes: account.notes
      });
      setOpen(true);
    } else if (mode === 'edit' && account) {
      setForm({
        name: account.name,
        type: account.type,
        registrationNumber: account.registrationNumber || '',
        taxNumber: account.taxNumber || '',
        address: account.address,
        city: account.city,
        state: account.state,
        postalCode: account.postalCode,
        country: account.country,
        phone: account.phone,
        email: account.email,
        website: account.website || '',
        status: account.status,
        businessUnitId: account.businessUnitId,
        accountManagerId: account.accountManagerId,
        creditLimit: account.creditLimit.toString(),
        paymentTerms: account.paymentTerms,
        industry: account.industry,
        notes: account.notes
      });
      setOpen(true);
    } else if (mode === 'add') {
      setForm({
        name: '',
        type: 'company',
        registrationNumber: '',
        taxNumber: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        email: '',
        website: '',
        status: 'active',
        businessUnitId: '',
        accountManagerId: '',
        creditLimit: '',
        paymentTerms: '',
        industry: '',
        notes: ''
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAccount(null);
    setDialogMode('add');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      creditLimit: parseFloat(form.creditLimit) || 0
    };

    try {
      if (dialogMode === 'edit' && selectedAccount) {
        const res = await fetch(`/api/accounts/${selectedAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Account updated successfully!', severity: 'success' });
          fetchAccounts();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to update account: ${errorData.error}`, severity: 'error' });
        }
      } else if (dialogMode === 'add') {
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Account added successfully!', severity: 'success' });
          fetchAccounts();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to add account: ${errorData.error}`, severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting account:', error);
      setSnackbar({ open: true, message: 'An error occurred while saving the account.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Account deleted successfully!', severity: 'success' });
        fetchAccounts();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete account.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({ open: true, message: 'An error occurred while deleting the account.', severity: 'error' });
    }
  };

  // Filtering and sorting
  const filteredAccounts = accounts.filter(account => {
    const searchLower = search.toLowerCase();
    const nameMatch = account.name.toLowerCase().includes(searchLower);
    const emailMatch = account.email.toLowerCase().includes(searchLower);
    const phoneMatch = account.phone.toLowerCase().includes(searchLower);
    
    // Apply filters
    const statusMatch = statusFilter === 'all' || account.status === statusFilter;
    const typeMatch = typeFilter === 'all' || account.type === typeFilter;
    
    return (nameMatch || emailMatch || phoneMatch) && statusMatch && typeMatch;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
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
      case 'suspended': return '#ff9800';
      default: return '#757575';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return '#2196f3';
      case 'individual': return '#9c27b0';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading accounts...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={fetchAccounts} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Accounts ({filteredAccounts.length} of {accounts.length})
            {statusFilter !== 'all' && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
            {typeFilter !== 'all' && ` - ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}`}
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog('add')}>
            Add Account
          </Button>
        </Box>
        
        {/* Filter Toggle Buttons */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Status:</Typography>
            <ToggleButtonGroup
              value={statusFilter}
              exclusive
              onChange={(e, newStatus) => newStatus && handleStatusFilterChange(newStatus)}
              aria-label="account status filter"
              size="small"
            >
              <ToggleButton value="all" aria-label="all accounts">All</ToggleButton>
              <ToggleButton value="active" aria-label="active accounts">Active</ToggleButton>
              <ToggleButton value="inactive" aria-label="inactive accounts">Inactive</ToggleButton>
              <ToggleButton value="suspended" aria-label="suspended accounts">Suspended</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Type:</Typography>
            <ToggleButtonGroup
              value={typeFilter}
              exclusive
              onChange={(e, newType) => newType && handleTypeFilterChange(newType)}
              aria-label="account type filter"
              size="small"
            >
              <ToggleButton value="all" aria-label="all types">All</ToggleButton>
              <ToggleButton value="company" aria-label="company accounts">Company</ToggleButton>
              <ToggleButton value="individual" aria-label="individual accounts">Individual</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        
        <TextField
          label="Search Accounts"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        
        {filteredAccounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {accounts.length === 0 ? 'No accounts found' : 'No accounts match your search and filter criteria'}
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
                    Account Name {sortBy === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('type')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Type {sortBy === 'type' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Contact</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Business Unit</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Account Manager</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Credit Limit</TableCell>
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
                {sortedAccounts.map(account => (
                  <TableRow
                    key={account.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDialog('view', account)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: getTypeColor(account.type) }}>
                          {account.type === 'company' ? <Business /> : <Person />}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {account.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {account.industry}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                        sx={{
                          backgroundColor: getTypeColor(account.type),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {account.phone}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {account.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {businessUnits.find(bu => bu.id === account.businessUnitId)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {users.find(u => u.id === account.accountManagerId)?.firstName + ' ' + 
                       users.find(u => u.id === account.accountManagerId)?.lastName || '-'}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {account.creditLimit.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        sx={{
                          backgroundColor: getStatusColor(account.status),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => handleOpenDialog('view', account)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit account">
                          <IconButton size="small" onClick={() => handleOpenDialog('edit', account)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete account">
                          <IconButton size="small" color="error" onClick={() => handleDelete(account.id)}>
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

      {/* Account Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {dialogMode === 'view' && selectedAccount && 'Account Details'}
          {dialogMode === 'edit' && 'Edit Account'}
          {dialogMode === 'add' && 'Add New Account'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            {/* Row 1: Name, Type */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="name"
                label="Account Name"
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
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={form.type}
                  label="Type"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Row 2: Registration Number, Tax Number */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="registrationNumber"
                label="Registration Number"
                value={form.registrationNumber}
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
                name="taxNumber"
                label="Tax Number"
                value={form.taxNumber}
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

            {/* Row 3: Address */}
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

            {/* Row 4: City, State, Postal Code */}
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

            {/* Row 5: Country, Phone */}
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

            {/* Row 6: Email, Website */}
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
              <TextField
                name="website"
                label="Website"
                value={form.website}
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

            {/* Row 7: Business Unit, Account Manager */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Business Unit</InputLabel>
                <Select
                  name="businessUnitId"
                  value={form.businessUnitId}
                  label="Business Unit"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="">Select Business Unit</MenuItem>
                  {businessUnits.map(bu => (
                    <MenuItem key={bu.id} value={bu.id}>
                      {bu.name} - {bu.location}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Account Manager</InputLabel>
                <Select
                  name="accountManagerId"
                  value={form.accountManagerId}
                  label="Account Manager"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="">Select Account Manager</MenuItem>
                  {users.filter(user => user.role === 'account_manager').map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 8: Credit Limit, Payment Terms */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="creditLimit"
                label="Credit Limit (ZMW)"
                type="number"
                value={form.creditLimit}
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
                name="paymentTerms"
                label="Payment Terms"
                value={form.paymentTerms}
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

            {/* Row 9: Industry, Status */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="industry"
                label="Industry"
                value={form.industry}
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
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Row 10: Notes */}
            <TextField
              name="notes"
              label="Notes"
              value={form.notes}
              onChange={handleFormChange}
              multiline
              rows={3}
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

export default Accounts;