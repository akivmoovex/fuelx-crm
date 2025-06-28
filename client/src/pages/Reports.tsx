import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress, CircularProgress,
  Tabs, Tab, Alert, Button
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
      currency: 'ZMW'
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
          <Typography variant="h5">Reports & Analytics</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
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
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Deals
                        </Typography>
                        <Typography variant="h4">
                          {salesSummary.summary.totalDeals}
                        </Typography>
                      </Box>
                      <Business color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Value
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(salesSummary.summary.totalValue)}
                        </Typography>
                      </Box>
                      <AttachMoney color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Win Rate
                        </Typography>
                        <Typography variant="h4">
                          {salesSummary.summary.winRate}%
                        </Typography>
                      </Box>
                      <TrendingUp color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Closed Won
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(salesSummary.summary.closedWonValue)}
                        </Typography>
                      </Box>
                      <Assessment color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Deals by Stage" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Stage</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesSummary.dealsByStage.map((stage) => (
                            <TableRow key={stage.stage}>
                              <TableCell>
                                <Chip
                                  label={stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}
                                  sx={{
                                    backgroundColor: getStageColor(stage.stage),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{stage._count.stage}</TableCell>
                              <TableCell>{formatCurrency(stage._sum.amount || 0)}</TableCell>
                              <TableCell>
                                {salesSummary.summary.totalDeals > 0 
                                  ? Math.round((stage._count.stage / salesSummary.summary.totalDeals) * 100)
                                  : 0}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Top Performing Users" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Deals</TableCell>
                            <TableCell>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesSummary.userPerformance
                            .sort((a, b) => b.totalValue - a.totalValue)
                            .slice(0, 5)
                            .map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell>{user.userName}</TableCell>
                              <TableCell>{user.dealCount}</TableCell>
                              <TableCell>{formatCurrency(user.totalValue)}</TableCell>
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
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Customers
                        </Typography>
                        <Typography variant="h4">
                          {customerAnalytics.totalCustomers}
                        </Typography>
                      </Box>
                      <People color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Customer Status Distribution" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customerAnalytics.statusDistribution.map((status) => (
                            <TableRow key={status.status}>
                              <TableCell>
                                <Chip
                                  label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                  sx={{
                                    backgroundColor: getStatusColor(status.status),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{status._count.status}</TableCell>
                              <TableCell>
                                {customerAnalytics.totalCustomers > 0 
                                  ? Math.round((status._count.status / customerAnalytics.totalCustomers) * 100)
                                  : 0}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Top Customers by Value" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Customer</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell>Deals</TableCell>
                            <TableCell>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {customerAnalytics.topCustomers.map((customer) => (
                            <TableRow key={customer.customerId}>
                              <TableCell>{customer.customerName}</TableCell>
                              <TableCell>{customer.company}</TableCell>
                              <TableCell>{customer.dealCount}</TableCell>
                              <TableCell>{formatCurrency(customer.totalValue)}</TableCell>
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
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Tasks
                        </Typography>
                        <Typography variant="h4">
                          {taskAnalytics.totalTasks}
                        </Typography>
                      </Box>
                      <Assignment color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Completed
                        </Typography>
                        <Typography variant="h4">
                          {taskAnalytics.completedTasks}
                        </Typography>
                      </Box>
                      <TrendingUp color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Overdue
                        </Typography>
                        <Typography variant="h4" color="error">
                          {taskAnalytics.overdueTasks}
                        </Typography>
                      </Box>
                      <TrendingDown color="error" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Completion Rate
                        </Typography>
                        <Typography variant="h4">
                          {taskAnalytics.totalTasks > 0 
                            ? Math.round((taskAnalytics.completedTasks / taskAnalytics.totalTasks) * 100)
                            : 0}%
                        </Typography>
                      </Box>
                      <Assessment color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Task Status Distribution" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {taskAnalytics.statusDistribution.map((status) => (
                            <TableRow key={status.status}>
                              <TableCell>
                                <Chip
                                  label={status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                  sx={{
                                    backgroundColor: getStatusColor(status.status),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{status._count.status}</TableCell>
                              <TableCell>
                                {taskAnalytics.totalTasks > 0 
                                  ? Math.round((status._count.status / taskAnalytics.totalTasks) * 100)
                                  : 0}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="User Task Load" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Tasks</TableCell>
                            <TableCell>Load</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {taskAnalytics.userTaskLoad
                            .sort((a, b) => b.taskCount - a.taskCount)
                            .map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell>{user.userName}</TableCell>
                              <TableCell>{user.taskCount}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={Math.min((user.taskCount / Math.max(...taskAnalytics.userTaskLoad.map(u => u.taskCount))) * 100, 100)}
                                      sx={{ height: 8, borderRadius: 5 }}
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
                <Card>
                  <CardHeader title="Pipeline by Stage" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Stage</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Total Value</TableCell>
                            <TableCell>Average Value</TableCell>
                            <TableCell>Avg Time (Days)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pipelineAnalysis.pipelineByStage.map((stage) => (
                            <TableRow key={stage.stage}>
                              <TableCell>
                                <Chip
                                  label={stage.stage.charAt(0).toUpperCase() + stage.stage.slice(1)}
                                  sx={{
                                    backgroundColor: getStageColor(stage.stage),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{stage.count}</TableCell>
                              <TableCell>{formatCurrency(stage.totalValue)}</TableCell>
                              <TableCell>{formatCurrency(stage.avgValue)}</TableCell>
                              <TableCell>
                                {pipelineAnalysis.timeInStage.find(t => t.stage === stage.stage)?.avgTimeInDays || 0}
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
                <Card>
                  <CardHeader title="Stage Conversion Rates" />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>From Stage</TableCell>
                            <TableCell>To Stage</TableCell>
                            <TableCell>Conversion Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pipelineAnalysis.conversionRates.map((conversion, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip
                                  label={conversion.fromStage.charAt(0).toUpperCase() + conversion.fromStage.slice(1)}
                                  sx={{
                                    backgroundColor: getStageColor(conversion.fromStage),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={conversion.toStage.charAt(0).toUpperCase() + conversion.toStage.slice(1)}
                                  sx={{
                                    backgroundColor: getStageColor(conversion.toStage),
                                    color: '#fff',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6" color="primary">
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
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Total Pipeline
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(revenueForecast.totalPipelineValue)}
                        </Typography>
                      </Box>
                      <BarChart color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Weighted Pipeline
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(revenueForecast.weightedPipelineValue)}
                        </Typography>
                      </Box>
                      <PieChart color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          This Month
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(revenueForecast.expectedRevenueThisMonth)}
                        </Typography>
                      </Box>
                      <TrendingUp color="success" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography color="textSecondary" gutterBottom>
                          Next Month
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(revenueForecast.expectedRevenueNextMonth)}
                        </Typography>
                      </Box>
                      <Timeline color="primary" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Deals Closing This Month" />
                  <CardContent>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {revenueForecast.dealsClosingThisMonth}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Expected revenue: {formatCurrency(revenueForecast.expectedRevenueThisMonth)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Deals Closing Next Month" />
                  <CardContent>
                    <Typography variant="h3" color="primary" gutterBottom>
                      {revenueForecast.dealsClosingNextMonth}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Expected revenue: {formatCurrency(revenueForecast.expectedRevenueNextMonth)}
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
