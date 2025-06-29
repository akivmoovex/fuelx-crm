import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task } from '../types';
import { apiClient } from '../utils/api';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, IconButton, Tooltip, TextField as MuiTextField, Grid, Card, CardContent, CardHeader, LinearProgress, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, Assignment, CalendarToday, 
  CheckCircle, Warning, Error, Info, Person, PriorityHigh, PriorityMedium, PriorityLow
} from '@mui/icons-material';

const statusOptions = ['pending', 'in-progress', 'completed', 'cancelled'];
const priorityOptions = ['low', 'normal', 'high', 'urgent'];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending',
    priority: 'normal',
    assignedTo: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'dueDate' | 'status' | 'priority'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchParams, setSearchParams] = useSearchParams();
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Get filters from URL params
  const statusFilter = searchParams.get('status') || 'all';

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Task[]>('/api/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    apiClient.get<any[]>('/api/users')
      .then(data => setUsers(data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    if (newStatus === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newStatus);
    }
    setSearchParams(searchParams);
  };

  const handleOpen = (mode: 'view' | 'edit' | 'add', task?: Task) => {
    setDialogMode(mode);
    setSelectedTask(task || null);
    
    if (mode === 'add') {
      setForm({
        title: '',
        description: '',
        dueDate: '',
        status: 'pending',
        priority: 'normal',
        assignedTo: ''
      });
    } else if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || ''
      });
    }
    
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!form.title.trim()) {
      errors.title = 'Task title is required';
    }

    if (!form.type) {
      errors.type = 'Task type is required';
    }

    if (!form.priority) {
      errors.priority = 'Priority is required';
    }

    if (!form.assignedTo) {
      errors.assignedTo = 'Assigned user is required';
    }

    if (!form.dueDate) {
      errors.dueDate = 'Due date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert dueDate to ISO string if present and not already in ISO format
    let dueDate = form.dueDate;
    if (dueDate && !dueDate.includes('T')) {
      dueDate = new Date(dueDate).toISOString();
    }

    const payload = { ...form, dueDate };

    try {
      if (dialogMode === 'edit' && selectedTask) {
        await apiClient.put(`/api/tasks/${selectedTask.id}`, payload);
        setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
      } else if (dialogMode === 'add') {
        await apiClient.post('/api/tasks', payload);
        setSnackbar({ open: true, message: 'Task added successfully!', severity: 'success' });
      }
      
      fetchTasks();
      handleClose();
    } catch (error) {
      console.error('Error submitting task:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'An error occurred while saving the task.', 
        severity: 'error' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await apiClient.delete(`/api/tasks/${id}`);
      setSnackbar({ open: true, message: 'Task deleted successfully!', severity: 'success' });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to delete task.', 
        severity: 'error' 
      });
    }
  };

  // Filtering and sorting
  const filteredTasks = tasks.filter(task => {
    const searchLower = search.toLowerCase();
    const titleMatch = task.title.toLowerCase().includes(searchLower);
    const descriptionMatch = (task.description || '').toLowerCase().includes(searchLower);
    
    // Apply status filter
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    
    return (titleMatch || descriptionMatch) && statusMatch;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';
    
    if (sortBy === 'dueDate') {
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
      setSortDirection(column === 'dueDate' ? 'desc' : 'asc');
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
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
        <Button onClick={fetchTasks} variant="contained">
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
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tasks Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Track and manage your tasks and activities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen('add')}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            Add Task
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
                <Assignment sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {tasks.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Tasks
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
                    {tasks.filter(t => t.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completed
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
                <Warning sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {tasks.filter(t => t.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending
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
                <CalendarToday sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {tasks.filter(t => {
                      if (!t.dueDate || t.status === 'completed') return false;
                      return new Date(t.dueDate) < new Date();
                    }).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Overdue
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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 300 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            startIcon={<Refresh />}
            onClick={fetchTasks}
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Tasks Table */}
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
                    Task Title
                    {sortBy === 'title' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleSort('dueDate')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Due Date
                    {sortBy === 'dueDate' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
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
                <TableCell>
                  <Button
                    onClick={() => handleSort('priority')}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Priority
                    {sortBy === 'priority' && (
                      <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </Button>
                </TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {task.description?.substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <CalendarToday sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {task.assignedUser ? `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen('view', task)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Task">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen('edit', task)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Task">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(task.id)}
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

      {/* Task Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Task' : 
           dialogMode === 'edit' ? 'Edit Task' : 'Task Details'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title *"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
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
                  label="Due Date *"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  disabled={dialogMode === 'view'}
                  error={!!formErrors.dueDate}
                  helperText={formErrors.dueDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {statusOptions.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.priority}>
                  <InputLabel>Priority *</InputLabel>
                  <Select
                    value={form.priority}
                    label="Priority *"
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    disabled={dialogMode === 'view'}
                  >
                    {priorityOptions.map(priority => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.priority && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formErrors.priority}
                    </Typography>
                  )}
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'add' ? 'Add Task' : 'Update Task'}
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

export default Tasks;