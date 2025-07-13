import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Account } from '../types';
import { apiClient } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, FilterList, Refresh, Business, Email, Phone, LocationOn,
  TrendingUp, People, AttachMoney, Assignment, CheckCircle, Warning, Error, Info, Close
} from '@mui/icons-material';

const statusOptions = ['active', 'inactive', 'pending', 'suspended'];
const typeOptions = ['company', 'individual', 'government', 'non-profit'];

// Industry options with search functionality
const industryOptions = [
  'Agriculture',
  'Automotive',
  'Banking & Finance',
  'Construction',
  'Education',
  'Energy & Utilities',
  'Food & Beverage',
  'Healthcare',
  'Hospitality & Tourism',
  'Information Technology',
  'Insurance',
  'Legal Services',
  'Manufacturing',
  'Media & Entertainment',
  'Mining & Metals',
  'Oil & Gas',
  'Pharmaceuticals',
  'Real Estate',
  'Retail',
  'Telecommunications',
  'Transportation & Logistics',
  'Wholesale Trade',
  'Other'
];

// Payment terms options
const paymentTermsOptions = [
  'Credit line',
  'Deposit',
  'Cash on Delivery',
  'Advance Payment',
  'Monthly Billing'
];

const Accounts: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
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
    creditLimit: 0,
    paymentTerms: 'Net 30',
    industry: '',
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'createdAt'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchParams, setSearchParams] = useSearchParams();
  const [industrySearch, setIndustrySearch] = useState('');
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Get filters from URL params
  const statusFilter = searchParams.get('status') || 'all';
  const typeFilter = searchParams.get('type') || 'all';

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Account[]>('/api/accounts');
      console.log('Fetched accounts:', data);
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
    // Fetch business units, users, and tenants
    Promise.all([
      apiClient.get<any[]>('/api/business-units'),
      apiClient.get<any[]>('/api/users'),
      apiClient.get<any[]>('/api/tenants')
    ]).then(([businessUnitsData, usersData, tenantsData]) => {
      setBusinessUnits(businessUnitsData);
      setUsers(usersData);
      setTenants(tenantsData);
    }).catch(err => {
      console.error('Error fetching data:', err);
      // Don't fail the entire page if these fail
    });
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

  const handleOpen = (mode: 'view' | 'edit' | 'add', account?: Account) => {
    setDialogMode(mode);
    setSelectedAccount(account || null);
    setFormErrors({});
    
    if (mode === 'add') {
      // For non-admin users, automatically set their business unit and tenant
      const defaultBusinessUnitId = user?.role !== 'SYSTEM_ADMIN' ? user?.businessUnitId || '' : '';
      const defaultAccountManagerId = user?.role !== 'SYSTEM_ADMIN' ? user?.id || '' : '';
      
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
        businessUnitId: defaultBusinessUnitId,
        accountManagerId: defaultAccountManagerId,
        creditLimit: 0,
        paymentTerms: 'Net 30',
        industry: '',
        notes: ''
      });
    } else if (account) {
      setForm({
        name: account.name,
        type: account.type,
        registrationNumber: account.registrationNumber || '',
        taxNumber: account.taxNumber || '',
        address: account.address || '',
        city: account.city || '',
        state: account.state || '',
        postalCode: account.postalCode || '',
        country: account.country || '',
        phone: account.phone || '',
        email: account.email || '',
        website: account.website || '',
        status: account.status,
        businessUnitId: account.businessUnitId || '',
        accountManagerId: account.accountManagerId || '',
        creditLimit: account.creditLimit || 0,
        paymentTerms: account.paymentTerms || 'Net 30',
        industry: account.industry || '',
        notes: account.notes || ''
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAccount(null);
    setSaveLoading(false);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Required fields validation
    if (!form.name.trim()) {
      errors.name = 'Account name is required';
    }

    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    if (!form.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!form.city.trim()) {
      errors.city = 'City is required';
    }

    if (!form.state.trim()) {
      errors.state = 'State/Province is required';
    }

    if (!form.country.trim()) {
      errors.country = 'Country is required';
    }

    if (!form.businessUnitId) {
      errors.businessUnitId = 'Business unit is required';
    }

    // Email validation (optional but if provided, must be valid)
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fixed save function
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
      console.log('Saving account:', form); // Debug log

      if (dialogMode === 'edit' && selectedAccount) {
        console.log('Updating account:', selectedAccount.id);
        await apiClient.put(`/api/accounts/${selectedAccount.id}`, form);
        setSnackbar({ open: true, message: 'Account updated successfully!', severity: 'success' });
      } else if (dialogMode === 'add') {
        console.log('Creating new account');
        await apiClient.post('/api/accounts', form);
        setSnackbar({ open: true, message: 'Account added successfully!', severity: 'success' });
      }

      fetchAccounts();
      handleClose();
    } catch (error) {
      console.error('Error saving account:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred while saving the account.',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      await apiClient.delete(`/api/accounts/${id}`);
      setSnackbar({ open: true, message: 'Account deleted successfully!', severity: 'success' });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete account.',
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
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'primary';
      case 'individual': return 'secondary';
      case 'government': return 'info';
      case 'non-profit': return 'warning';
      default: return 'default';
    }
  };

  // Filter industries based on search
  const filteredIndustries = industryOptions.filter(industry =>
    industry.toLowerCase().includes(industrySearch.toLowerCase())
  );

  // Filter and sort accounts
  const filteredAccounts = accounts.filter(account => {
    const searchLower = search.toLowerCase();
    const nameMatch = account.name.toLowerCase().includes(searchLower);
    const emailMatch = (account.email || '').toLowerCase().includes(searchLower);
    const phoneMatch = (account.phone || '').toLowerCase().includes(searchLower);
    const industryMatch = (account.industry || '').toLowerCase().includes(searchLower);

    return nameMatch || emailMatch || phoneMatch || industryMatch;
  });

  const sortedAccounts = filteredAccounts.filter(account => {
    const statusMatch = statusFilter === 'all' || account.status === statusFilter;
    const typeMatch = typeFilter === 'all' || account.type === typeFilter;
    return statusMatch && typeMatch;
  }).sort((a, b) => {
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
        <Button onClick={fetchAccounts} variant="contained">
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
              Accounts Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage your business accounts and customer relationships
            </Typography>
          </Box>
          {/* Hide Add Account button on mobile for all users */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'SALES_MANAGER') && (
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
                Add Account
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
              <Business sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {accounts.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Accounts
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
                {accounts.filter(a => a.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Accounts
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
              <Warning sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {accounts.filter(a => a.status === 'pending').length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending Review
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
              <AttachMoney sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ZMW {accounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Credit Limit
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                {typeOptions.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchAccounts}
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
                      onClick={() => handleSort('name')}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      Name
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
                  <TableCell>Credit Line & Amounts</TableCell>
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
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAccounts.map((account) => (
                  <TableRow 
                    key={account.id} 
                    hover 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpen('view', account)}
                  >
                    <TableCell>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {account.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.type}
                        size="small"
                        color={getTypeColor(account.type) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          ZMW {account.creditLimit?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Credit Limit
                        </Typography>
                        <Box mt={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {account.paymentTerms || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.status}
                        color={getStatusColor(account.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {account.notes || 'No notes'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleOpen('view', account);
                          }}
                          sx={{ color: 'primary.main' }}
                          title="View Account"
                        >
                          <Visibility />
                        </IconButton>
                        {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'SALES_MANAGER') && (
                          <>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleOpen('edit', account);
                              }}
                              sx={{ color: 'primary.main' }}
                              title="Edit Account"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleDelete(account.id);
                              }}
                              sx={{ color: 'error.main' }}
                              title="Delete Account"
                            >
                              <Delete />
                            </IconButton>
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
          {sortedAccounts.map((account) => (
            <Grid item xs={12} key={account.id}>
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
                        {account.name}
                      </Typography>
                      <Chip
                        label={account.type}
                        size="small"
                        color={getTypeColor(account.type) as any}
                        sx={{ fontSize: '0.7rem', mr: 1 }}
                      />
                      <Chip
                        label={account.status}
                        size="small"
                        color={getStatusColor(account.status) as any}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {account.email && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        <Email sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {account.email}
                      </Typography>
                    )}
                    {account.phone && (
                      <Typography variant="body2" color="textSecondary">
                        <Phone sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {account.phone}
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
                        ZMW {(account.creditLimit || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Credit Limit
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      width: 1, 
                      bgcolor: 'grey.300', 
                      mx: 1 
                    }} />
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {account.paymentTerms || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Payment Terms
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ 
                      fontStyle: 'italic',
                      maxHeight: 60,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {account.notes || 'No notes available'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Improved Account Dialog */}
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
              {dialogMode === 'add' && 'Add New Account'}
              {dialogMode === 'edit' && 'Edit Account'}
              {dialogMode === 'view' && 'Account Details'}
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
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Basic Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Account Type</InputLabel>
                    <Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      label="Account Type"
                      disabled={dialogMode === 'view'}
                    >
                      {typeOptions.map(type => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      label="Status"
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
              </Grid>
            </Box>

            {/* Assignment Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'blue.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'blue.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <People sx={{ mr: 1, color: 'blue.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'blue.main' }}>
                  Assignment
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  {user?.role === 'SYSTEM_ADMIN' ? (
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
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      label="Business Unit"
                      value={user?.businessUnit?.name || 'Not assigned'}
                      disabled
                      sx={{ 
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    />
                  )}
                  {formErrors.businessUnitId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formErrors.businessUnitId}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Account Manager</InputLabel>
                    <Select
                      value={form.accountManagerId}
                      onChange={(e) => setForm({ ...form, accountManagerId: e.target.value })}
                      label="Account Manager"
                      disabled={dialogMode === 'view'}
                    >
                      <MenuItem value="">Select Account Manager</MenuItem>
                      {user?.role === 'SYSTEM_ADMIN' ? (
                        // For SYSTEM_ADMIN, show all sales users
                        users.filter(u => ['SALES_REP', 'SALES_MANAGER'].includes(u.role)).map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </MenuItem>
                        ))
                      ) : (
                        // For non-admin users, show all users from the same business unit
                        (() => {
                          const userBusinessUnit = form.businessUnitId || user?.businessUnitId;
                          const filteredUsers = users.filter(u => u.businessUnitId === userBusinessUnit);
                          
                          // If no users found with business unit filter, show all users as fallback
                          const usersToShow = filteredUsers.length > 0 ? filteredUsers : users;
                          
                          return usersToShow.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.role})
                            </MenuItem>
                          ));
                        })()
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Contact Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'green.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'green.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Email sx={{ mr: 1, color: 'green.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'green.main' }}>
                  Contact Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Phone *"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Address Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'orange.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'orange.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <LocationOn sx={{ mr: 1, color: 'orange.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'orange.main' }}>
                  Address Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address *"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={dialogMode === 'view'}
                    multiline
                    rows={2}
                    error={!!formErrors.address}
                    helperText={formErrors.address}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="City *"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.city}
                    helperText={formErrors.city}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="State/Province *"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.state}
                    helperText={formErrors.state}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Country *"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    disabled={dialogMode === 'view'}
                    error={!!formErrors.country}
                    helperText={formErrors.country}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Business Information Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'purple.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'purple.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Info sx={{ mr: 1, color: 'purple.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'purple.main' }}>
                  Business Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Registration Number"
                    value={form.registrationNumber}
                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tax Number"
                    value={form.taxNumber}
                    onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                    disabled={dialogMode === 'view'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Industry</InputLabel>
                    <Select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      label="Industry"
                      disabled={dialogMode === 'view'}
                      onOpen={() => setShowIndustryDropdown(true)}
                      onClose={() => setShowIndustryDropdown(false)}
                    >
                      <MenuItem value="">Select Industry</MenuItem>
                      {filteredIndustries.map(industry => (
                        <MenuItem key={industry} value={industry}>
                          {industry}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {showIndustryDropdown && (
                    <TextField
                      fullWidth
                      placeholder="Search industry..."
                      value={industrySearch}
                      onChange={(e) => setIndustrySearch(e.target.value)}
                      sx={{ mt: 1 }}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Grid>
              </Grid>
            </Box>

            {/* Payment Terms Section */}
            <Box sx={{
              mb: 3,
              p: { xs: 2, md: 3 },
              bgcolor: 'blue.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'blue.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <AttachMoney sx={{ mr: 1, color: 'blue.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'blue.main' }}>
                  Payment Terms
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      label="Payment Terms"
                      disabled={dialogMode === 'view'}
                    >
                      {paymentTermsOptions.map(term => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Credit Limit"
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                    disabled={dialogMode === 'view'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">ZMW</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Additional Information Section */}
            <Box sx={{
              p: { xs: 2, md: 3 },
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Assignment sx={{ mr: 1, color: 'grey.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'grey.main' }}>
                  Additional Information
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    disabled={dialogMode === 'view'}
                    placeholder="Enter any additional notes about this account..."
                  />
                </Grid>
              </Grid>
            </Box>
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

export default Accounts;