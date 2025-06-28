import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress, CircularProgress,
  Tabs, Tab, Alert, Button, Divider
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, Business, Assignment, 
  AttachMoney, Assessment, Timeline, PieChart, BarChart
} from '@mui/icons-material';

interface SalesSummary {
  summary: {
    totalDeals: number;
    totalValue: number;
    closedWonCount: number;
    closedWonValue: number;
    winRate: number;
  };
  dealsByStage: Array<{
    stage: string;
    _count: { stage: number };
    _sum: { amount: number | null };
  }>;
  dealsByType: Array<{
    dealType: string;
    _count: { dealType: number };
    _sum: { amount: number | null };
  }>;
  userPerformance: Array<{
    userId: string | null;
    userName: string;
    dealCount: number;
    totalValue: number;
  }>;
}

interface CustomerAnalytics {
  totalCustomers: number;
  statusDistribution: Array<{
    status: string;
    _count: { status: number };
  }>;
  sourceDistribution: Array<{
    source: string;
    _count: { source: number };
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    company: string;
    totalValue: number;
    dealCount: number;
  }>;
}

interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  statusDistribution: Array<{
    status: string;
    _count: { status: number };
  }>;
  priorityDistribution: Array<{
    priority: string;
    _count: { priority: number };
  }>;
  userTaskLoad: Array<{
    userId: string | null;
    userName: string;
    taskCount: number;
  }>;
}

interface PipelineAnalysis {
  pipelineByStage: Array<{
    stage: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  conversionRates: Array<{
    fromStage: string;
    toStage: string;
    conversionRate: number;
  }>;
  timeInStage: Array<{
    stage: string;
    avgTimeInDays: number;
  }>;
}

interface RevenueForecast {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  expectedRevenueThisMonth: number;
  expectedRevenueNextMonth: number;
  dealsClosingThisMonth: number;
  dealsClosingNextMonth: number;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null);
  const [pipelineAnalysis, setPipelineAnalysis] = useState<PipelineAnalysis | null>(null);
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesRes, customerRes, taskRes, pipelineRes, forecastRes] = await Promise.all([
        fetch(`/api/reports/sales-summary?period=${period}`),
        fetch('/api/reports/customer-analytics'),
        fetch('/api/reports/task-analytics'),
        fetch('/api/reports/pipeline-analysis'),
        fetch('/api/reports/revenue-forecast')
      ]);

      if (!salesRes.ok || !customerRes.ok || !taskRes.ok || !pipelineRes.ok || !forecastRes.ok) {
        throw new Error('Failed to fetch reports data');
      }

      const [salesData, customerData, taskData, pipelineData, forecastData] = await Promise.all([
        salesRes.json(),
        customerRes.json(),
        taskRes.json(),
        pipelineRes.json(),
        forecastRes.json()
      ]);

      setSalesSummary(salesData);
      setCustomerAnalytics(customerData);
      setTaskAnalytics(taskData);
      setPipelineAnalysis(pipelineData);
      setRevenueForecast(forecastData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
      case 'lead': return '#ff9800';
      case 'prospect': return '#2196f3';
      case 'customer': return '#4caf50';
      case 'inactive': return '#f44336';
      case 'pending': return '#ff9800';
      case 'completed': return '#4caf50';
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
        <Button onClick={fetchReports} variant="contained">
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Reports & Analytics</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
              size="small"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ 
            mb: 4,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 500
            },
            '& .Mui-selected': {
              fontWeight: 'bold'
            }
          }}
        >
          <Tab label="Sales Performance" icon={<TrendingUp />} />
          <Tab label="Customer Analytics" icon={<People />} />
          <Tab label="Task Management" icon={<Assignment />} />
          <Tab label="Pipeline Analysis" icon={<Timeline />} />
          <Tab label="Revenue Forecast" icon={<AttachMoney />} />
        </Tabs>

        {/* Sales Performance Tab */}
        {activeTab === 0 && salesSummary && (
          <Box>
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
                          Total Deals
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {salesSummary.summary.totalDeals}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          All time deals
                        </Typography>
                      </Box>
                      <Business sx={{ fontSize: 40, opacity: 0.8 }} />
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
                          Total Value
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(salesSummary.summary.totalValue)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Pipeline value
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
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Win Rate
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {salesSummary.summary.winRate}%
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Success rate
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
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Closed Won
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(salesSummary.summary.closedWonValue)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Revenue earned
                        </Typography>
                      </Box>
                      <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Deals by Stage" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesSummary.dealsByStage.map((stage) => (
                            <TableRow key={stage.stage} hover>
                              <TableCell>
                                <Chip
                                  label={stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStageColor(stage.stage),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {stage._count.stage}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(stage._sum.amount || 0)}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {salesSummary.summary.totalDeals > 0 
                                    ? Math.round((stage._count.stage / salesSummary.summary.totalDeals) * 100)
                                    : 0}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Top Performing Users" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Deals</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesSummary.userPerformance
                            .sort((a, b) => b.totalValue - a.totalValue)
                            .slice(0, 5)
                            .map((user) => (
                            <TableRow key={user.userId} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {user.userName}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {user.dealCount}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(user.totalValue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Customer Analytics Tab */}
        {activeTab === 1 && customerAnalytics && (
          <Box>
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
                          {customerAnalytics.totalCustomers}
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
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Customer Status Distribution" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customerAnalytics.statusDistribution.map((status) => (
                            <TableRow key={status.status} hover>
                              <TableCell>
                                <Chip
                                  label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStatusColor(status.status),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {status._count.status}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {customerAnalytics.totalCustomers > 0 
                                    ? Math.round((status._count.status / customerAnalytics.totalCustomers) * 100)
                                    : 0}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Top Customers by Value" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customerAnalytics.topCustomers.map((customer) => (
                            <TableRow key={customer.customerId} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {customer.customerName}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {customer.company}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(customer.totalValue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Task Management Tab */}
        {activeTab === 2 && taskAnalytics && (
          <Box>
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
                          Total Tasks
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {taskAnalytics.totalTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          All tasks
                        </Typography>
                      </Box>
                      <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
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
                          Completed
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {taskAnalytics.completedTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Finished tasks
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
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Overdue
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {taskAnalytics.overdueTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Past due
                        </Typography>
                      </Box>
                      <TrendingDown sx={{ fontSize: 40, opacity: 0.8 }} />
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
                          Completion Rate
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {taskAnalytics.totalTasks > 0 
                            ? Math.round((taskAnalytics.completedTasks / taskAnalytics.totalTasks) * 100)
                            : 0}%
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Success rate
                        </Typography>
                      </Box>
                      <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Task Status Distribution" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {taskAnalytics.statusDistribution.map((status) => (
                            <TableRow key={status.status} hover>
                              <TableCell>
                                <Chip
                                  label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStatusColor(status.status),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {status._count.status}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {taskAnalytics.totalTasks > 0 
                                    ? Math.round((status._count.status / taskAnalytics.totalTasks) * 100)
                                    : 0}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="User Task Load" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Tasks</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Load</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {taskAnalytics.userTaskLoad
                            .sort((a, b) => b.taskCount - a.taskCount)
                            .map((user) => (
                            <TableRow key={user.userId} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {user.userName}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {user.taskCount}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={Math.min((user.taskCount / Math.max(...taskAnalytics.userTaskLoad.map(u => u.taskCount))) * 100, 100)}
                                      sx={{ 
                                        height: 8, 
                                        borderRadius: 5,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 5
                                        }
                                      }}
                                    />
                                  </Box>
                                  <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {Math.round((user.taskCount / Math.max(...taskAnalytics.userTaskLoad.map(u => u.taskCount))) * 100)}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Pipeline Analysis Tab */}
        {activeTab === 3 && pipelineAnalysis && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Pipeline by Stage" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total Value</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Avg Value</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Avg Time (Days)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pipelineAnalysis.pipelineByStage.map((stage) => (
                            <TableRow key={stage.stage} hover>
                              <TableCell>
                                <Chip
                                  label={stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStageColor(stage.stage),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {stage.count}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(stage.totalValue)}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(stage.avgValue)}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary">
                                  {pipelineAnalysis.timeInStage.find(t => t.stage === stage.stage)?.avgTimeInDays || 0}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Stage Conversion Rates" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>From Stage</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>To Stage</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Conversion Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pipelineAnalysis.conversionRates.map((conversion, index) => (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Chip
                                  label={conversion.fromStage.charAt(0).toUpperCase() + conversion.fromStage.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStageColor(conversion.fromStage),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={conversion.toStage.charAt(0).toUpperCase() + conversion.toStage.slice(1)}
                                  size="small"
                                  sx={{
                                    backgroundColor: getStageColor(conversion.toStage),
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                  {conversion.conversionRate}%
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Revenue Forecast Tab */}
        {activeTab === 4 && revenueForecast && (
          <Box>
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
                          Total Pipeline
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(revenueForecast.totalPipelineValue)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          All deals
                        </Typography>
                      </Box>
                      <BarChart sx={{ fontSize: 40, opacity: 0.8 }} />
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
                          Weighted Pipeline
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(revenueForecast.weightedPipelineValue)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Probability adjusted
                        </Typography>
                      </Box>
                      <PieChart sx={{ fontSize: 40, opacity: 0.8 }} />
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
                          This Month
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(revenueForecast.expectedRevenueThisMonth)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Expected revenue
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
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Next Month
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(revenueForecast.expectedRevenueNextMonth)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Expected revenue
                        </Typography>
                      </Box>
                      <Timeline sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Deals Closing This Month" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {revenueForecast.dealsClosingThisMonth}
                    </Typography>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      Expected Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {formatCurrency(revenueForecast.expectedRevenueThisMonth)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Deals Closing Next Month" 
                    sx={{ 
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                      color: 'white',
                      '& .MuiCardHeader-title': { fontWeight: 'bold' }
                    }}
                  />
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h2" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                      {revenueForecast.dealsClosingNextMonth}
                    </Typography>
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      Expected Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                      {formatCurrency(revenueForecast.expectedRevenueNextMonth)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Reports;