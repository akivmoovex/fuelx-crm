import React, { useState, useEffect } from 'react';
import { Deal, Customer, User } from '../types';
import { apiClient } from '../utils/api';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, AttachMoney, TrendingUp, 
  CheckCircle, Warning, Error, Info, Business, Person
} from '@mui/icons-material';

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
  const [sortBy, setSortBy] = useState<'title' | 'amount' | 'stage' | 'expectedCloseDate'>('expectedCloseDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; firstName?: string; lastName?: string } | null>(null);

  // Fetch deals with better error handling
  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching deals...');
      
      const data = await apiClient.get<Deal[]>('/api/deals');
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
    apiClient.get<Customer[]>('/api/customers')
      .then(data => setCustomers(data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  useEffect(() => {
    apiClient.get<User[]>('/api/users')
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
        await apiClient.put(`/api/deals/${selectedDeal.id}`, payload);
        setSnackbar({ open: true, message: 'Deal updated successfully!', severity: 'success' });
        fetchDeals();
        handleClose();
      } else if (dialogMode === 'add') {
        // Add deal
        await apiClient.post('/api/deals', payload);
        setSnackbar({ open: true, message: 'Deal added successfully!', severity: 'success' });
        fetchDeals();
        handleClose();
      }
    } catch (error) {
      console.error('Error submitting deal:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'An error occurred while saving the deal.', 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await apiClient.delete(`/api/deals/${id}`);
      setSnackbar({ open: true, message: 'Deal deleted successfully!', severity: 'success' });
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to delete deal.', 
        severity: 'error' 
      });
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
        <Button onClick={fetchDeals} variant="contained">
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
              <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
              Deals Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Track and manage your sales opportunities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('add')}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Add Deal
          </Button>
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
                <AttachMoney sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {deals.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Deals
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
                    ${deals.filter(d => d.stage === 'closed-won').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Won Revenue
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
                <TrendingUp sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {deals.filter(d => ['prospecting', 'qualification', 'proposal', 'negotiation'].includes(d.stage)).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Deals
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
                    ${deals.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Pipeline
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
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          
          <Button
            startIcon={<Refresh />}
            onClick={fetchDeals}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Deals Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell>
                  <Button
                    onClick={() => handleSort('title')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Deal Title
                    {sortBy === 'title' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('amount')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Amount
                    {sortBy === 'amount' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('stage')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Stage
                    {sortBy === 'stage' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Probability</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDeals.map((deal) => (
                <TableRow key={deal.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {deal.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {deal.description?.substring(0, 50)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(deal.amount, deal.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={deal.stage}
                      color={getStageColor(deal.stage) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deal.probability}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deal.customer ? `${deal.customer.firstName} ${deal.customer.lastName}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {deal.assignedUser ? `${deal.assignedUser.firstName} ${deal.assignedUser.lastName}` : 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('view', deal)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Deal">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', deal)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Deal">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(deal.id)}
                          color="error"
                        >
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
      </Paper>

      {/* Deal Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Deal' : 
           dialogMode === 'edit' ? 'Edit Deal' : 'Deal Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deal Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Probability (%)"
                  type="number"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: e.target.value })}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Stage</InputLabel>
                  <Select
                    value={form.stage}
                    label="Stage"
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {stageOptions.map(stage => (
                      <MenuItem key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Deal Type</InputLabel>
                  <Select
                    value={form.dealType}
                    label="Deal Type"
                    onChange={(e) => setForm({ ...form, dealType: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {dealTypeOptions.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Account</InputLabel>
                  <Select
                    value={form.customerId}
                    label="Account"
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="">None</MenuItem>
                    {customers.map(customer => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName} - {customer.company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    value={form.assignedTo}
                    label="Assigned To"
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  disabled={dialogMode === 'view'}
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
                  disabled={dialogMode === 'view'}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'add' ? 'Add Deal' : 'Update Deal'}
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

export default Deals;