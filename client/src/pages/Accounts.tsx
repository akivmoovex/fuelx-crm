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
    
    if (mode === 'add') {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare form data - convert empty strings to null for optional fields
      const formData = {
        ...form,
        businessUnitId: form.businessUnitId || null,
        accountManagerId: form.accountManagerId || null,
        registrationNumber: form.registrationNumber || null,
        taxNumber: form.taxNumber || null,
        website: form.website || null,
        notes: form.notes || null
      };

      if (dialogMode === 'edit' && selectedAccount) {
        await apiClient.put(`/api/accounts/${selectedAccount.id}`, formData);
        setSnackbar({ open: true, message: 'Account updated successfully!', severity: 'success' });
      } else if (dialogMode === 'add') {
        await apiClient.post('/api/accounts', formData);
        setSnackbar({ open: true, message: 'Account added successfully!', severity: 'success' });
      }
      
      fetchAccounts();
      handleClose();
    } catch (error) {
      console.error('Error submitting account:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'An error occurred while saving the account.', 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await apiClient.delete(`/api/accounts/${id}`);
      setSnackbar({ open: true, message: 'Account deleted successfully!', severity: 'success' });
      
      // Force refresh the accounts list
      await fetchAccounts();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to delete account.', 
        severity: 'error' 
      });
    }
  };

  // Filtering and sorting
  const filteredAccounts = accounts.filter(account => {
    const searchLower = search.toLowerCase();
    const nameMatch = account.name.toLowerCase().includes(searchLower);
    const emailMatch = (account.email || '').toLowerCase().includes(searchLower);
    const phoneMatch = (account.phone || '').toLowerCase().includes(searchLower);
    const industryMatch = (account.industry || '').toLowerCase().includes(searchLower);
    
    // Apply filters
    const statusMatch = statusFilter === 'all' || account.status === statusFilter;
    const typeMatch = typeFilter === 'all' || account.type === typeFilter;
    
    return (nameMatch || emailMatch || phoneMatch || industryMatch) && statusMatch && typeMatch;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
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
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'company': return 'primary';
      case 'individual': return 'secondary';
      case 'government': return 'info';
      case 'non-profit': return 'warning';
      default: return 'default';
    }
  };

  // Filter industry options based on search
  const filteredIndustries = industryOptions.filter(industry =>
    industry.toLowerCase().includes(industrySearch.toLowerCase())
  );

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
                ${accounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0).toLocaleString()}
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
                  <TableCell>Contact</TableCell>
                  <TableCell>Industry</TableCell>
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
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAccounts.map((account) => (
                  <TableRow key={account.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {account.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.registrationNumber && `Reg: ${account.registrationNumber}`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.type}
                        color={getTypeColor(account.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {account.email && (
                          <Box display="flex" alignItems="center" mb={0.5}>
                            <Email sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">{account.email}</Typography>
                          </Box>
                        )}
                        {account.phone && (
                          <Box display="flex" alignItems="center">
                            <Phone sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">{account.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {account.industry || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.status}
                        color={getStatusColor(account.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen('view', account)}
                            color="primary"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {(user?.role === 'SYSTEM_ADMIN' || user?.role === 'SALES_MANAGER') && (
                          <>
                            <Tooltip title="Edit Account">
                              <IconButton
                                size="small"
                                onClick={() => handleOpen('edit', account)}
                                color="primary"
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Account">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(account.id)}
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
        {sortedAccounts.map((account) => (
          <Card
            key={account.id}
            sx={{
              mb: 2,
              cursor: 'pointer',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}
            onClick={() => handleOpen('view', account)}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Header with Status Badge */}
              <Box sx={{
                p: 2.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px 12px 0 0'
              }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1} minWidth={0}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: '1.1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {account.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Business sx={{ fontSize: 16, opacity: 0.9 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.9,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {account.type}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={account.status.toUpperCase()}
                    size="small"
                    sx={{
                      ml: 1,
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      height: 24,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>

              {/* Content Section */}
              <Box sx={{ p: 2.5 }}>
                {/* Key Information Cards */}
                <Grid container spacing={1.5} mb={2}>
                  <Grid item xs={6}>
                    <Box sx={{
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
                        Industry
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {account.industry || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{
                      p: 1.5,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
                        Credit Limit
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${(account.creditLimit || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Contact Information */}
                {(account.email || account.phone) && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'primary.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}
                  >
                    <Typography variant="caption" color="primary.main" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                      Contact Information
                    </Typography>
                    {account.email && (
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <Email sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {account.email}
                        </Typography>
                      </Box>
                    )}
                    {account.phone && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {account.phone}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Registration Info */}
                {account.registrationNumber && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: 'secondary.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'secondary.200'
                    }}
                  >
                    <Typography variant="caption" color="secondary.main" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                      Registration Details
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Reg: {account.registrationNumber}
                    </Typography>
                    {account.taxNumber && (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Tax: {account.taxNumber}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* View Details Button - Only View Action Available on Mobile */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen('view', account);
                  }}
                  startIcon={<Visibility />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  View Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {sortedAccounts.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
              bgcolor: 'rgba(255,255,255,0.8)',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'grey.300'
            }}
          >
            <Business sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
              No Accounts Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No accounts are currently available'
              }
            </Typography>
          </Box>
        )}
      </Box>

      {/* Improved Account Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          pb: 2
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {dialogMode === 'add' && 'Add New Account'}
                {dialogMode === 'edit' && 'Edit Account'}
                {dialogMode === 'view' && 'Account Details'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {dialogMode === 'add' && 'Create a new business account'}
                {dialogMode === 'edit' && 'Update account information'}
                {dialogMode === 'view' && 'View account details'}
              </Typography>
            </Box>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Section 1: Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                  sx={{ mb: 2 }}
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
                    variant="outlined"
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
                    variant="outlined"
                  >
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Section 2: Business Unit Assignment */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                  Business Unit Assignment
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Business Unit</InputLabel>
                  <Select
                    value={form.businessUnitId}
                    onChange={(e) => setForm({ ...form, businessUnitId: e.target.value })}
                    label="Business Unit"
                    disabled={dialogMode === 'view'}
                    variant="outlined"
                    required
                  >
                    <MenuItem value="">
                      <em>Select Business Unit</em>
                    </MenuItem>
                    {businessUnits.map(bu => (
                      <MenuItem key={bu.id} value={bu.id}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {bu.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {bu.location} • {bu.city}, {bu.state}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Account Manager</InputLabel>
                  <Select
                    value={form.accountManagerId}
                    onChange={(e) => setForm({ ...form, accountManagerId: e.target.value })}
                    label="Account Manager"
                    disabled={dialogMode === 'view'}
                    variant="outlined"
                  >
                    <MenuItem value="">
                      <em>Select Account Manager</em>
                    </MenuItem>
                    {users.filter(u => ['SALES_REP', 'SALES_MANAGER'].includes(u.role)).map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {user.role} • {user.email}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Section 3: Contact Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                  Contact Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  disabled={dialogMode === 'view'}
                  variant="outlined"
                />
              </Grid>

              {/* Section 4: Address Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                  Address Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State/Province"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  disabled={dialogMode === 'view'}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Section 5: Business Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                  Business Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Registration Number"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  disabled={dialogMode === 'view'}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax Number"
                  value={form.taxNumber}
                  onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                  disabled={dialogMode === 'view'}
                  variant="outlined"
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
                    variant="outlined"
                    onOpen={() => setShowIndustryDropdown(true)}
                    onClose={() => setShowIndustryDropdown(false)}
                  >
                    <MenuItem value="">
                      <em>Select Industry</em>
                    </MenuItem>
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
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Terms</InputLabel>
                  <Select
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    label="Payment Terms"
                    disabled={dialogMode === 'view'}
                    variant="outlined"
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
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Section 6: Additional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold', mt: 2 }}>
                  Additional Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  disabled={dialogMode === 'view'}
                  variant="outlined"
                  placeholder="Enter any additional notes about this account..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          {dialogMode !== 'view' && (user?.role === 'SYSTEM_ADMIN' || user?.role === 'SALES_MANAGER') && (
            <Button onClick={handleSubmit} variant="contained" size="large">
              {dialogMode === 'add' ? 'Create Account' : 'Update Account'}
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

export default Accounts;