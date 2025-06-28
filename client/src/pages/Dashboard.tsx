import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Button,
  LinearProgress, CircularProgress, Alert, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  People, TrendingUp, Business, Assignment, Email, Phone, Add,
  Notifications, CalendarToday, AttachMoney, Assessment, Timeline,
  ArrowForward, CheckCircle, Warning, Error, Info
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Deal, Customer, Task, User } from '../types';

interface DashboardData {
  summary: {
    totalCustomers: number;
    totalDeals: number;
    totalTasks: number;
    totalRevenue: number;
    pendingTasks: number;
    overdueTasks: number;
    activeDeals: number;
    closedDeals: number;
  };
  recentDeals: Deal[];
  recentCustomers: Customer[];
  upcomingTasks: Task[];
  topDeals: Deal[];
  userStats: {
    dealsThisMonth: number;
    tasksCompleted: number;
    revenueGenerated: number;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customersRes, dealsRes, tasksRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/deals'),
        fetch('/api/tasks')
      ]);

      if (!customersRes.ok || !dealsRes.ok || !tasksRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [customers, deals, tasks] = await Promise.all([
        customersRes.json(),
        dealsRes.json(),
        tasksRes.json()
      ]);

      // Calculate summary data
      const totalRevenue = deals
        .filter((deal: Deal) => deal.stage === 'closed-won')
        .reduce((sum: number, deal: Deal) => sum + deal.amount, 0);

      const pendingTasks = tasks.filter((task: Task) => task.status === 'pending').length;
      const overdueTasks = tasks.filter((task: Task) => {
        if (!task.dueDate || task.status === 'completed') return false;
        return new Date(task.dueDate) < new Date();
      }).length;

      const activeDeals = deals.filter((deal: Deal) => 
        ['prospecting', 'qualification', 'proposal', 'negotiation'].includes(deal.stage)
      ).length;

      const closedDeals = deals.filter((deal: Deal) => 
        ['closed-won', 'closed-lost'].includes(deal.stage)
      ).length;

      // Get recent data
      const recentDeals = deals
        .sort((a: Deal, b: Deal) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const recentCustomers = customers
        .sort((a: Customer, b: Customer) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const upcomingTasks = tasks
        .filter((task: Task) => task.status === 'pending')
        .sort((a: Task, b: Task) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
        .slice(0, 5);

      const topDeals = deals
        .filter((deal: Deal) => deal.stage !== 'closed-lost')
        .sort((a: Deal, b: Deal) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate user-specific stats
      const userDeals = deals.filter((deal: Deal) => deal.assignedTo === user?.id);
      const userTasks = tasks.filter((task: Task) => task.assignedTo === user?.id);

      const userStats = {
        dealsThisMonth: userDeals.filter((deal: Deal) => {
          const dealDate = new Date(deal.createdAt);
          const now = new Date();
          return dealDate.getMonth() === now.getMonth() && dealDate.getFullYear() === now.getFullYear();
        }).length,
        tasksCompleted: userTasks.filter((task: Task) => task.status === 'completed').length,
        revenueGenerated: userDeals
          .filter((deal: Deal) => deal.stage === 'closed-won')
          .reduce((sum: number, deal: Deal) => sum + deal.amount, 0)
      };

      setDashboardData({
        summary: {
          totalCustomers: customers.length,
          totalDeals: deals.length,
          totalTasks: tasks.length,
          totalRevenue,
          pendingTasks,
          overdueTasks,
          activeDeals,
          closedDeals
        },
        recentDeals,
        recentCustomers,
        upcomingTasks,
        topDeals,
        userStats
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
      case 'lead': return '#ff9800';
      case 'prospect': return '#2196f3';
      case 'customer': return '#4caf50';
      case 'inactive': return '#f44336';
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

  const formatDate = (dateString: string | null) => {
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
        <Button onClick={fetchDashboardData} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  if (!dashboardData) return null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's your CRM overview for today
          </Typography>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Customers
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {dashboardData.summary.totalCustomers}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      All customers
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Active Deals
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {dashboardData.summary.activeDeals}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      In pipeline
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {formatCurrency(dashboardData.summary.totalRevenue)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Closed deals
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Pending Tasks
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {dashboardData.summary.pendingTasks}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {dashboardData.summary.overdueTasks} overdue
                    </Typography>
                  </Box>
                  <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Performance Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Your Performance This Month" 
                sx={{ 
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                    {dashboardData.userStats.dealsThisMonth}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    New deals created
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {dashboardData.userStats.tasksCompleted}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tasks completed
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(dashboardData.userStats.revenueGenerated)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Revenue generated
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Quick Actions" 
                sx={{ 
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', p: 2, mb: 1 }}
                    >
                      Add New Customer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Business />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', p: 2, mb: 1 }}
                    >
                      Create New Deal
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      startIcon={<Assignment />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', p: 2, mb: 1 }}
                    >
                      Add New Task
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Assessment />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', p: 2, mb: 1 }}
                    >
                      View Reports
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Recent Deals" 
                action={
                  <Tooltip title="View all deals">
                    <IconButton size="small">
                      <ArrowForward />
                    </IconButton>
                  </Tooltip>
                }
                sx={{ 
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {dashboardData.recentDeals.map((deal, index) => (
                    <React.Fragment key={deal.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ backgroundColor: getStageColor(deal.stage) }}>
                            <Business />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {deal.title}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(deal.amount)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Chip
                                label={deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                                size="small"
                                sx={{
                                  backgroundColor: getStageColor(deal.stage),
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem',
                                  mr: 1
                                }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {new Date(deal.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.recentDeals.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Upcoming Tasks" 
                action={
                  <Tooltip title="View all tasks">
                    <IconButton size="small">
                      <ArrowForward />
                    </IconButton>
                  </Tooltip>
                }
                sx={{ 
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '& .MuiCardHeader-title': { fontWeight: 'bold' }
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List>
                  {dashboardData.upcomingTasks.map((task, index) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            backgroundColor: task.dueDate && new Date(task.dueDate) < new Date() 
                              ? '#f44336' 
                              : getPriorityColor(task.priority) 
                          }}>
                            {task.dueDate && new Date(task.dueDate) < new Date() ? (
                              <Warning />
                            ) : (
                              <Assignment />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                              <Chip
                                label={task.priority}
                                size="small"
                                sx={{
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                {task.description || 'No description'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatDate(task.dueDate)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.upcomingTasks.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;
