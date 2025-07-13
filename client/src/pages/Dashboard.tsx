import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Button,
  LinearProgress, CircularProgress, Alert, Divider, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, Snackbar, Fade, Zoom, Grow, Skeleton
} from '@mui/material';
import {
  People, TrendingUp, Business, Assignment, Email, Phone, Add,
  Notifications, CalendarToday, AttachMoney, Assessment, Timeline,
  ArrowForward, CheckCircle, Warning, Error, Info, Edit, Delete,
  Refresh, Download, Share, FilterList, Search, Visibility, AccountCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Deal, Account, Task, User } from '../types';
import { formatDate } from '../utils/dateUtils';

interface DashboardData {
  summary: {
    totalAccounts: number;
    totalDeals: number;
    totalTasks: number;
    totalRevenue: number;
    pendingTasks: number;
    overdueTasks: number;
    activeDeals: number;
    closedDeals: number;
  };
  recentDeals: Array<{
    id: string;
    title: string;
    amount: number;
    stage: string;
    accountId: string;
    account?: { name: string };
    createdAt: string;
  }>;
  recentAccounts: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  upcomingTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
  }>;
  topDeals: Array<{
    id: string;
    title: string;
    amount: number;
    stage: string;
    probability: number;
  }>;
  userStats: {
    dealsThisMonth: number;
    tasksCompleted: number;
    revenueGenerated: number;
  };
}

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  
  // Interactive states
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(null);
  const [quickActionDialog, setQuickActionDialog] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Quick action form states
  const [quickActionForm, setQuickActionForm] = useState({
    title: '',
    description: '',
    type: '',
    customerId: '',
    amount: '',
    dueDate: '',
    priority: 'normal'
  });

  const API_BASE_URL = 'http://localhost:3001';

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch data from APIs
      const [accountsRes, dealsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/accounts`),
        fetch(`${API_BASE_URL}/api/deals`),
        fetch(`${API_BASE_URL}/api/tasks`)
      ]);

      let accounts = [];
      let deals = [];
      let tasks = [];

      if (accountsRes.ok) accounts = await accountsRes.json();
      if (dealsRes.ok) deals = await dealsRes.json();
      if (tasksRes.ok) tasks = await tasksRes.json();

      // Calculate summary data
      const totalRevenue = deals
        .filter((deal: any) => deal.stage === 'closed-won')
        .reduce((sum: number, deal: any) => sum + deal.amount, 0);

      const pendingTasks = tasks.filter((task: any) => task.status === 'pending').length;
      const overdueTasks = tasks.filter((task: any) => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < new Date();
      }).length;

      const activeDeals = deals.filter((deal: any) => 
        ['prospecting', 'qualification', 'proposal', 'negotiation'].includes(deal.stage)
      ).length;

      const closedDeals = deals.filter((deal: any) => 
        ['closed-won', 'closed-lost'].includes(deal.stage)
      ).length;

      // Get recent data
      const recentDeals = deals
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const recentAccounts = accounts
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const upcomingTasks = tasks
        .filter((task: any) => task.status === 'pending')
        .sort((a: any, b: any) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
        .slice(0, 5);

      const topDeals = deals
        .filter((deal: any) => deal.stage !== 'closed-lost')
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate user-specific stats
      const userDeals = deals.filter((deal: any) => deal.assignedTo === user?.id);
      const userTasks = tasks.filter((task: any) => task.assignedTo === user?.id);

      const userStats = {
        dealsThisMonth: userDeals.filter((deal: any) => {
          const dealDate = new Date(deal.createdAt);
          const now = new Date();
          return dealDate.getMonth() === now.getMonth() && dealDate.getFullYear() === now.getFullYear();
        }).length,
        tasksCompleted: userTasks.filter((task: any) => task.status === 'completed').length,
        revenueGenerated: userDeals
          .filter((deal: any) => deal.stage === 'closed-won')
          .reduce((sum: number, deal: any) => sum + deal.amount, 0)
      };

      setDashboardData({
        summary: {
          totalAccounts: accounts.length,
          totalDeals: deals.length,
          totalTasks: tasks.length,
          totalRevenue,
          pendingTasks,
          overdueTasks,
          activeDeals,
          closedDeals
        },
        recentDeals,
        recentAccounts,
        upcomingTasks,
        topDeals,
        userStats
      });

      if (showRefresh) {
        // Show success message
        setTimeout(() => setRefreshLoading(false), 1000);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  // Interactive handlers
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleQuickAction = (action: string) => {
    setQuickActionDialog(action);
    setQuickActionForm({
      title: '',
      description: '',
      type: action,
      customerId: '',
      amount: '',
      dueDate: '',
      priority: 'normal'
    });
  };

  const handleQuickActionSubmit = async () => {
    try {
      let endpoint = '';
      let payload = {};

      switch (quickActionForm.type) {
        case 'customer':
          endpoint = '/api/accounts';
          payload = {
            name: quickActionForm.title,
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
            accountManagerId: user?.id || '',
            creditLimit: 0,
            paymentTerms: 'Net 30',
            industry: quickActionForm.description,
            notes: ''
          };
          break;
        case 'deal':
          endpoint = '/api/deals';
          payload = {
            title: quickActionForm.title,
            description: quickActionForm.description,
            amount: parseFloat(quickActionForm.amount) || 0,
            currency: 'ZMW',
            stage: 'prospecting',
            probability: 0,
            accountId: quickActionForm.customerId || '',
            dealType: 'fuel',
            assignedTo: user?.id,
            source: 'dashboard',
            notes: ''
          };
          break;
        case 'task':
          endpoint = '/api/tasks';
          payload = {
            title: quickActionForm.title,
            description: quickActionForm.description,
            dueDate: quickActionForm.dueDate,
            status: 'pending',
            priority: quickActionForm.priority,
            assignedTo: user?.id
          };
          break;
        default:
          throw new Error('Invalid action type');
      }

      console.log('Creating item:', { type: quickActionForm.type, endpoint, payload });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('API Response:', response.status, response.statusText);

      if (response.ok) {
        const createdItem = await response.json();
        console.log('Created item:', createdItem);
        
        setSnackbar({ 
          open: true, 
          message: `${quickActionForm.type === 'customer' ? 'Account' : quickActionForm.type.charAt(0).toUpperCase() + quickActionForm.type.slice(1)} created successfully!`, 
          severity: 'success' 
        });
        setQuickActionDialog(null);
        
        // Navigate to the appropriate page after creation
        switch (quickActionForm.type) {
          case 'customer':
            navigate('/accounts');
            break;
          case 'deal':
            navigate('/deals');
            break;
          case 'task':
            navigate('/tasks?status=pending');
            break;
        }
        
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to create ${quickActionForm.type}`);
      }
    } catch (error) {
      console.error('Error creating item:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to create item. Please try again.', 
        severity: 'error' 
      });
    }
  };

  const handleItemClick = (type: string, item: any) => {
    switch (type) {
      case 'deal':
        setSelectedDeal(item);
        break;
      case 'task':
        setSelectedTask(item);
        break;
      case 'customer':
        setSelectedCustomer(item);
        break;
    }
  };

  const handleNavigate = (path: string) => {
    // Add query parameters for filtering
    if (path === '/tasks') {
      navigate('/tasks?status=pending');
    } else if (path === '/customers') {
      navigate('/accounts');
    } else if (path === '/deals') {
      navigate('/deals');
    } else if (path === '/reports') {
      navigate('/reports');
    } else {
      navigate(path);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4caf50';
      case 'inactive': return '#f44336';
      case 'suspended': return '#ff9800';
      default: return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'normal': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        setSnackbar({ 
          open: true, 
          message: 'Task marked as completed!', 
          severity: 'success' 
        });
        fetchDashboardData(); // Refresh dashboard
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to complete task. Please try again.', 
        severity: 'error' 
      });
    }
  };

  // Show loading while auth is loading
  if (authLoading || loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => fetchDashboardData()} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="info">
          No dashboard data available. Please try refreshing the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 } }}>
      {/* Header */}
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
              Welcome back, {user?.firstName || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Here's your CRM overview for today
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh dashboard">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshLoading}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <Refresh className={refreshLoading ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Key Metrics Cards */}
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
                {dashboardData.summary.totalAccounts}
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
              <Business sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {dashboardData.summary.activeDeals}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Deals
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
              <AttachMoney sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(dashboardData.summary.totalRevenue)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Revenue
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
              <Assignment sx={{ fontSize: { xs: 32, md: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {dashboardData.summary.pendingTasks}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending Tasks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Desktop Layout */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Quick Actions */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        fullWidth
                        sx={{ 
                          justifyContent: 'flex-start', 
                          p: 2, 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        onClick={() => handleQuickAction('customer')}
                      >
                        Add New Account
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        startIcon={<Business />}
                        fullWidth
                        sx={{ 
                          justifyContent: 'flex-start', 
                          p: 2, 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        onClick={() => handleQuickAction('deal')}
                      >
                        Create New Deal
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        startIcon={<Assignment />}
                        fullWidth
                        sx={{ 
                          justifyContent: 'flex-start', 
                          p: 2, 
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        onClick={() => handleQuickAction('task')}
                      >
                        Add New Task
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Recent Deals */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Recent Deals
                  </Typography>
                  {dashboardData.recentDeals.slice(0, 5).map((deal) => (
                    <Box key={deal.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {deal.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(deal.amount)} • {deal.stage}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Upcoming Tasks */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Upcoming Tasks
                  </Typography>
                  {dashboardData.upcomingTasks.slice(0, 5).map((task) => (
                    <Box key={task.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatRelativeDate(task.dueDate)} • {task.priority}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Mobile Layout */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {/* Quick Actions */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Quick Actions
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                fullWidth
                sx={{ 
                  justifyContent: 'flex-start', 
                  p: 1.5, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
                onClick={() => handleQuickAction('customer')}
              >
                Add New Account
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Business />}
                fullWidth
                sx={{ 
                  justifyContent: 'flex-start', 
                  p: 1.5, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
                onClick={() => handleQuickAction('deal')}
              >
                Create New Deal
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<Assignment />}
                fullWidth
                sx={{ 
                  justifyContent: 'flex-start', 
                  p: 1.5, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
                onClick={() => handleQuickAction('task')}
              >
                Add New Task
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Recent Activity */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Recent Deals
          </Typography>
          {dashboardData.recentDeals.slice(0, 3).map((deal) => (
            <Box key={deal.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {deal.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatCurrency(deal.amount)} • {deal.stage}
              </Typography>
            </Box>
          ))}
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Upcoming Tasks
          </Typography>
          {dashboardData.upcomingTasks.slice(0, 3).map((task) => (
            <Box key={task.id} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {task.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                                        {formatRelativeDate(task.dueDate)} • {task.priority}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Quick Action Dialog */}
      <Dialog 
        open={!!quickActionDialog} 
        onClose={() => setQuickActionDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Add New {quickActionForm.type?.charAt(0).toUpperCase() + quickActionForm.type?.slice(1)}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {quickActionForm.type === 'customer' && (
            <>
              <TextField
                fullWidth
                label="Full Name"
                placeholder="e.g., John Doe"
                value={quickActionForm.title}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, title: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Enter the customer's full name"
                required
              />
              <TextField
                fullWidth
                label="Company"
                placeholder="e.g., ABC Company"
                value={quickActionForm.description}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, description: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Enter the company name"
                required
              />
            </>
          )}
          
          {quickActionForm.type === 'deal' && (
            <>
              <TextField
                fullWidth
                label="Deal Title"
                placeholder="e.g., Fuel Supply Contract"
                value={quickActionForm.title}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, title: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Enter a descriptive title for the deal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                placeholder="e.g., Monthly fuel supply for ABC Company"
                value={quickActionForm.description}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                helperText="Brief description of the deal"
                required
              />
              <TextField
                fullWidth
                label="Amount (ZMW)"
                type="number"
                placeholder="e.g., 50000"
                value={quickActionForm.amount}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, amount: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Enter the deal amount in ZMW"
                required
              />
            </>
          )}
          
          {quickActionForm.type === 'task' && (
            <>
              <TextField
                fullWidth
                label="Task Title"
                placeholder="e.g., Follow up with client"
                value={quickActionForm.title}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, title: e.target.value })}
                sx={{ mb: 2 }}
                helperText="Enter a clear title for the task"
                required
              />
              <TextField
                fullWidth
                label="Description"
                placeholder="e.g., Call client to discuss proposal"
                value={quickActionForm.description}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                helperText="Detailed description of what needs to be done"
                required
              />
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={quickActionForm.dueDate}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
                helperText="When should this task be completed?"
                required
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={quickActionForm.priority}
                  label="Priority"
                  onChange={(e) => setQuickActionForm({ ...quickActionForm, priority: e.target.value })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
                <Typography variant="caption" color="textSecondary">
                  How urgent is this task?
                </Typography>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickActionDialog(null)}>Cancel</Button>
          <Button 
            onClick={() => {
              console.log('Create button clicked for:', quickActionForm.type);
              handleQuickActionSubmit();
            }} 
            variant="contained"
            disabled={!quickActionForm.title.trim() || 
                     (quickActionForm.type === 'deal' && !quickActionForm.amount) ||
                     (quickActionForm.type === 'task' && !quickActionForm.dueDate)}
          >
            Create {quickActionForm.type?.charAt(0).toUpperCase() + quickActionForm.type?.slice(1)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default Dashboard;
 