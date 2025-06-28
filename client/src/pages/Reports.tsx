import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent, CardHeader,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress, CircularProgress,
  Tabs, Tab, Alert, Button, Divider, Skeleton
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, Business, Assignment, 
  AttachMoney, Assessment, Timeline, PieChart, BarChart,
  Refresh, Download, Visibility
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:3001';

interface ReportData {
  summary: {
    totalAccounts: number;
    totalCustomers: number;
    totalDeals: number;
    totalTasks: number;
    totalRevenue: number;
    activeDeals: number;
    pendingTasks: number;
  };
  revenueByAccount: Array<{
    name: string;
    total: number;
  }>;
  dealsByStage: Array<{
    stage: string;
    count: number;
  }>;
  tasksByStatus: Array<{
    status: string;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  accountsByStatus: Array<{
    status: string;
    count: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchReportData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch all report data
      const [
        summaryRes,
        revenueByAccountRes,
        dealsByStageRes,
        tasksByStatusRes,
        monthlyRevenueRes,
        accountsByStatusRes,
        topPerformersRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/reports/summary`),
        fetch(`${API_BASE_URL}/api/reports/revenue-by-account`),
        fetch(`${API_BASE_URL}/api/reports/deals-by-stage`),
        fetch(`${API_BASE_URL}/api/reports/tasks-by-status`),
        fetch(`${API_BASE_URL}/api/reports/monthly-revenue`),
        fetch(`${API_BASE_URL}/api/reports/accounts-by-status`),
        fetch(`${API_BASE_URL}/api/reports/top-performers`)
      ]);

      const [
        summary,
        revenueByAccount,
        dealsByStage,
        tasksByStatus,
        monthlyRevenue,
        accountsByStatus,
        topPerformers
      ] = await Promise.all([
        summaryRes.ok ? summaryRes.json() : {},
        revenueByAccountRes.ok ? revenueByAccountRes.json() : [],
        dealsByStageRes.ok ? dealsByStageRes.json() : [],
        tasksByStatusRes.ok ? tasksByStatusRes.json() : [],
        monthlyRevenueRes.ok ? monthlyRevenueRes.json() : [],
        accountsByStatusRes.ok ? accountsByStatusRes.json() : [],
        topPerformersRes.ok ? topPerformersRes.json() : []
      ]);

      setReportData({
        summary,
        revenueByAccount,
        dealsByStage,
        tasksByStatus,
        monthlyRevenue,
        accountsByStatus,
        topPerformers
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

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
      case 'active':
      case 'completed':
      case 'closed-won':
        return 'success';
      case 'pending':
      case 'in-progress':
      case 'negotiation':
        return 'warning';
      case 'closed-lost':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="rectangular" height={300} />
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
          Error: {error}
        </Alert>
        <Button onClick={() => fetchReportData()} variant="contained">
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
        {activeTab === 0 && reportData && (
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
                          Total Revenue
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {formatCurrency(reportData.summary.totalRevenue)}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          All time revenue
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
                          Total Accounts
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {reportData.summary.totalAccounts}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          All accounts
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
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Active Deals
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {reportData.summary.activeDeals}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Active deals
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
                          {reportData.summary.pendingTasks}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Pending tasks
                        </Typography>
                      </Box>
                      <Assignment sx={{ fontSize: 40, opacity: 0.8 }} />
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
                            <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.dealsByStage.map((stage) => {
                            const total = reportData.dealsByStage.reduce((sum, d) => sum + d.count, 0);
                            const percentage = total > 0 ? ((stage.count / total) * 100).toFixed(1) : '0';
                            
                            return (
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
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2">{percentage}%</Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={parseFloat(percentage)}
                                      sx={{ width: 60, height: 6, borderRadius: 3 }}
                                    />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Card sx={{ height: '100%' }}>
                  <CardHeader 
                    title="Tasks by Status" 
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
                          {reportData.tasksByStatus.map((status) => {
                            const total = reportData.tasksByStatus.reduce((sum, t) => sum + t.count, 0);
                            const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : '0';
                            
                            return (
                              <TableRow key={status.status} hover>
                                <TableCell>
                                  <Chip
                                    label={status.status}
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
                                  {status.count}
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2">{percentage}%</Typography>
                                    <LinearProgress
                                      variant="determinate"
                                      value={parseFloat(percentage)}
                                      sx={{ width: 60, height: 6, borderRadius: 3 }}
                                    />
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Top Performers */}
        {activeTab === 1 && reportData && (
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
                          Top Performers
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {reportData.topPerformers.length}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Top performers
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
                    title="Top Performers" 
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.topPerformers.map((performer) => (
                            <TableRow key={performer.id} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {performer.name}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(performer.revenue)}
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
                    title="Revenue by Account" 
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
                            <TableCell sx={{ fontWeight: 'bold' }}>Account</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.revenueByAccount.slice(0, 5).map((account, index) => (
                            <TableRow key={index} hover>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {account.name}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'medium' }}>
                                {formatCurrency(account.total)}
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
      </Paper>
    </Container>
  );
};

export default Reports;