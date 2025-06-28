import React, { useState, useEffect } from 'react';
import { Deal, Customer, User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, Grid, Divider
} from '@mui/material';

const stageOptions = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const currencyOptions = ['ZMW', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const probabilityOptions = [0, 10, 25, 50, 75, 90, 100];
const dealTypeOptions = ['fuel', 'insurance'];
const insuranceTypeOptions = ['3rd Party', 'Comprehensive'];
const businessUnitOptions = ['Lusaka', 'Kafue', 'Chirundu', 'Business Development'];

// Get current user from localStorage with better error handling
const getCurrentUser = (): { id: string; role: string; firstName?: string; lastName?: string } | null => {
  try {
    const user = localStorage.getItem('user');
    if (!user) {
      console.log('No user found in localStorage');
      return null;
    }
    const parsed = JSON.parse(user);
    console.log('Parsed user from localStorage:', parsed);
    
    // Check if we have the required fields
    if (!parsed.id) {
      console.log('User missing id field');
      return null;
    }
    
    return {
      id: parsed.id,
      role: parsed.role || 'user', // Default to 'user' if role is missing
      firstName: parsed.firstName,
      lastName: parsed.lastName
    };
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

type DialogMode = 'view' | 'edit' | 'add';

const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('view');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'ZMW',
    stage: 'prospecting' as const,
    probability: '0',
    expectedCloseDate: '',
    actualCloseDate: '',
    customerId: '',
    assignedTo: '',
    source: '',
    notes: '',
    dealType: 'fuel' as 'fuel' | 'insurance',
    litresPerMonth: '',
    insuranceType: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'title' | 'stage' | 'expectedCloseDate'>('expectedCloseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; firstName?: string; lastName?: string } | null>(null);

  // Fetch deals with better error handling
  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching deals...');
      
      const response = await fetch('/api/deals');
      console.log('Deals response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Deals data received:', data);
      setDeals(data);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    console.log('Current user from getCurrentUser:', user);
    setCurrentUser(user);
    fetchDeals();
  }, []);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  // Handle opening dialogs
  const handleOpenDialog = (mode: DialogMode, deal?: Deal) => {
    setDialogMode(mode);
    setSelectedDeal(deal || null);
    
    if (mode === 'view' && deal) {
      // View mode - populate form for display (read-only)
      setForm({
        title: deal.title,
        description: deal.description || '',
        amount: deal.amount.toString(),
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.probability.toString(),
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '',
        actualCloseDate: deal.actualCloseDate ? deal.actualCloseDate.slice(0, 10) : '',
        customerId: deal.customerId,
        assignedTo: deal.assignedTo || '',
        source: deal.source || '',
        notes: deal.notes || '',
        dealType: (deal as any).dealType || 'fuel',
        litresPerMonth: (deal as any).litresPerMonth || '',
        insuranceType: (deal as any).insuranceType || ''
      });
      setOpen(true);
    } else if (mode === 'edit' && deal) {
      // Edit mode - populate form
      setForm({
        title: deal.title,
        description: deal.description || '',
        amount: deal.amount.toString(),
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.probability.toString(),
        expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.slice(0, 10) : '',
        actualCloseDate: deal.actualCloseDate ? deal.actualCloseDate.slice(0, 10) : '',
        customerId: deal.customerId,
        assignedTo: deal.assignedTo || '',
        source: deal.source || '',
        notes: deal.notes || '',
        dealType: (deal as any).dealType || 'fuel',
        litresPerMonth: (deal as any).litresPerMonth || '',
        insuranceType: (deal as any).insuranceType || ''
      });
      setOpen(true);
    } else if (mode === 'add') {
      // Add mode - reset form with current user as account manager if they exist in users list
      const currentUserInList = users.find(user => user.id === currentUser?.id);
      const defaultAssignedTo = currentUserInList ? currentUser.id : '';
      
      setForm({
        title: '',
        description: '',
        amount: '',
        currency: 'ZMW',
        stage: 'prospecting',
        probability: '0',
        expectedCloseDate: '',
        actualCloseDate: '',
        customerId: '',
        assignedTo: defaultAssignedTo, // Set to current user if they exist in users list, otherwise empty (Unassigned)
        source: '',
        notes: '',
        dealType: 'fuel',
        litresPerMonth: '',
        insuranceType: ''
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedDeal(null);
    setDialogMode('view');
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
      amount: parseFloat(form.amount),
      probability: parseInt(form.probability),
      expectedCloseDate: form.expectedCloseDate || null,
      actualCloseDate: form.actualCloseDate || null,
      assignedTo: form.assignedTo || null,
      litresPerMonth: form.dealType === 'fuel' ? parseInt(form.litresPerMonth) || null : null,
      insuranceType: form.dealType === 'insurance' ? form.insuranceType || null : null
    };

    try {
      if (dialogMode === 'edit' && selectedDeal) {
        // Edit deal
        const res = await fetch(`/api/deals/${selectedDeal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Deal updated successfully!', severity: 'success' });
          fetchDeals();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to update deal: ${errorData.error}`, severity: 'error' });
        }
      } else if (dialogMode === 'add') {
        // Add deal
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Deal added successfully!', severity: 'success' });
          fetchDeals();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to add deal: ${errorData.error}`, severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting deal:', error);
      setSnackbar({ open: true, message: 'An error occurred while saving the deal.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Deal deleted successfully!', severity: 'success' });
        fetchDeals();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete deal.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      setSnackbar({ open: true, message: 'An error occurred while deleting the deal.', severity: 'error' });
    }
  };

  // Proper filtering logic
  const filteredDeals = deals
    .filter(deal => {
      // User-based filtering
      const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
      const isAssigned = currentUser?.id ? deal.assignedTo === currentUser.id : false;
      
      // Admins see all deals, others see only their own
      if (isAdmin) return true;
      return isAssigned;
    })
    .filter(deal => {
      // Search filtering
      const searchLower = search.toLowerCase();
      const titleMatch = deal.title.toLowerCase().includes(searchLower);
      const descriptionMatch = (deal.description || '').toLowerCase().includes(searchLower);
      const customerMatch = deal.customer ? 
        `${deal.customer.firstName} ${deal.customer.lastName}`.toLowerCase().includes(searchLower) : false;
      
      return titleMatch || descriptionMatch || customerMatch;
    });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
    if (sortBy === 'expectedCloseDate') {
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
      setSortDirection(column === 'expectedCloseDate' ? 'desc' : 'asc');
    }
  };

  // Get stage color
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return '#ff9800';
      case 'qualification': return '#2196f3';
      case 'proposal': return '#9c27b0';
      case 'negotiation': return '#ff5722';
      case 'closed-won': return '#4caf50';
      case 'closed-lost': return '#f44336';
      default: return '#757575';
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading deals...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={fetchDeals} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Deals ({filteredDeals.length} of {deals.length})</Typography>
          <Button variant="contained" onClick={() => handleOpenDialog('add')}>Add Deal</Button>
        </Box>
        
        <TextField
          label="Search Deals"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        
        {filteredDeals.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {deals.length === 0 ? 'No deals found' : 'No deals match your current filters'}
            </Typography>
            {deals.length > 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Try adjusting your search or check if you have permission to view these deals.
              </Typography>
            )}
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
                    onClick={() => handleSort('title')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Title {sortBy === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell
                    onClick={() => handleSort('amount')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Amount {sortBy === 'amount' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('stage')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Stage {sortBy === 'stage' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Probability</TableCell>
                  <TableCell
                    onClick={() => handleSort('expectedCloseDate')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Expected Close {sortBy === 'expectedCloseDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Assigned To</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedDeals.map(deal => (
                  <TableRow
                    key={deal.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDialog('view', deal)}
                  >
                    <TableCell>{deal.title}</TableCell>
                    <TableCell>
                      {deal.customer ? `${deal.customer.firstName} ${deal.customer.lastName}` : ''}
                      {deal.customer?.company && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {deal.customer.company}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(deal.amount, deal.currency)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                        sx={{
                          backgroundColor: getStageColor(deal.stage),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {deal.probability}%
                        </Typography>
                        <Box
                          sx={{
                            width: 60,
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${deal.probability}%`,
                              height: '100%',
                              backgroundColor: deal.probability > 50 ? '#4caf50' : deal.probability > 25 ? '#ff9800' : '#f44336'
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {formatDate(deal.expectedCloseDate)}
                    </TableCell>
                    <TableCell>
                      {deal.assignedUser ? `${deal.assignedUser.firstName} ${deal.assignedUser.lastName}` : '-'}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button size="small" onClick={() => handleOpenDialog('edit', deal)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(deal.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Deal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {dialogMode === 'view' && selectedDeal && 'Deal Details'}
          {dialogMode === 'edit' && 'Edit Deal'}
          {dialogMode === 'add' && 'Add New Deal'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            {/* Row 1: Title, Customer */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="title"
                label="Title"
                value={form.title}
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
                <InputLabel>Customer</InputLabel>
                <Select
                  name="customerId"
                  value={form.customerId}
                  label="Customer"
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
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 2: Deal Type, Litres/Insurance Type */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Deal Type</InputLabel>
                <Select
                  name="dealType"
                  value={form.dealType}
                  label="Deal Type"
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
                  {dealTypeOptions.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {form.dealType === 'fuel' ? (
                <TextField
                  name="litresPerMonth"
                  label="Litres per Month"
                  type="number"
                  value={form.litresPerMonth}
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
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Insurance Type</InputLabel>
                  <Select
                    name="insuranceType"
                    value={form.insuranceType}
                    label="Insurance Type"
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
                    {insuranceTypeOptions.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            {/* Row 3: Amount, Currency */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="amount"
                label="Amount"
                type="number"
                value={form.amount}
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
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={form.currency}
                  label="Currency"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  {currencyOptions.map(currency => (
                    <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 4: Description (full width) - Reduced to 2 rows */}
            <TextField
              name="description"
              label="Description"
              value={form.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={2}
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 5, // Much larger padding for visual separation
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Row 5: Stage, Probability */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Stage</InputLabel>
                <Select
                  name="stage"
                  value={form.stage}
                  label="Stage"
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
                  {stageOptions.map(stage => (
                    <MenuItem key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Probability (%)</InputLabel>
                <Select
                  name="probability"
                  value={form.probability}
                  label="Probability (%)"
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
                  {probabilityOptions.map(prob => (
                    <MenuItem key={prob} value={prob.toString()}>{prob}%</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 6: Expected Close Date, Actual Close Date */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="expectedCloseDate"
                label="Expected Close Date"
                type="date"
                value={form.expectedCloseDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <TextField
                name="actualCloseDate"
                label="Actual Close Date"
                type="date"
                value={form.actualCloseDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
            </Box>

            {/* Row 7: Account Manager, Business Unit */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Account Manager</InputLabel>
                <Select
                  name="assignedTo"
                  value={form.assignedTo}
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
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Business Unit</InputLabel>
                <Select
                  name="source"
                  value={form.source}
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
                  {businessUnitOptions.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 8: Notes (full width) - Reduced to 2 rows */}
            <TextField
              name="notes"
              label="Notes"
              value={form.notes}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={2}
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

export default Deals;