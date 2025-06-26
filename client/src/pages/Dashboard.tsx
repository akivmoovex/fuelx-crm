import React from 'react';
import {
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import {
  People,
  TrendingUp,
  Business,
  Assignment,
  Email,
  Phone
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Customers',
      value: '1,234',
      icon: <People color="primary" />,
      color: '#1976d2',
      change: '+12%'
    },
    {
      title: 'Active Prospects',
      value: '567',
      icon: <TrendingUp color="success" />,
      color: '#2e7d32',
      change: '+8%'
    },
    {
      title: 'New Leads',
      value: '89',
      icon: <Business color="warning" />,
      color: '#ed6c02',
      change: '+23%'
    },
    {
      title: 'Tasks Due',
      value: '23',
      icon: <Assignment color="error" />,
      color: '#d32f2f',
      change: '-5%'
    }
  ];

  const recentCustomers = [
    { name: 'John Doe', company: 'Tech Corp', status: 'customer', date: '2 hours ago' },
    { name: 'Jane Smith', company: 'Startup Inc', status: 'prospect', date: '1 day ago' },
    { name: 'Mike Johnson', company: 'Enterprise LLC', status: 'lead', date: '2 days ago' },
    { name: 'Sarah Wilson', company: 'Small Business Co', status: 'customer', date: '3 days ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'success';
      case 'prospect': return 'warning';
      case 'lead': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Here's what's happening with your CRM today.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      {stat.change} from last month
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Customers
              </Typography>
              <List>
                {recentCustomers.map((customer, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>
                        {customer.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={customer.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {customer.company}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={customer.status} 
                              color={getStatusColor(customer.status) as any}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {customer.date}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email color="primary" />
                  <Typography>Send follow-up emails</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone color="primary" />
                  <Typography>Schedule calls with prospects</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Assignment color="primary" />
                  <Typography>Review pending tasks</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Business color="primary" />
                  <Typography>Add new leads</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
