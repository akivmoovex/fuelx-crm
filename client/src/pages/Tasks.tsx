import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Chip, ToggleButtonGroup, ToggleButton
} from '@mui/material';

const statusOptions = ['pending', 'completed'];
const priorityOptions = ['low', 'normal', 'high'];

const Tasks: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending' as const,
    priority: 'normal' as const,
    assignedTo: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'dueDate' | 'priority' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get status filter from URL params
  const statusFilter = searchParams.get('status') || 'all';

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
    fetch('/api/users')
      .then(res => res.json())
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

  // Handle opening dialogs
  const handleOpenDialog = (mode: 'view' | 'edit' | 'add', task?: Task) => {
    setDialogMode(mode);
    setSelectedTask(task || null);
    
    if (mode === 'view' && task) {
      setForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || ''
      });
      setOpen(true);
    } else if (mode === 'edit' && task) {
      setForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || ''
      });
      setOpen(true);
    } else if (mode === 'add') {
      setForm({
        title: '',
        description: '',
        dueDate: '',
        status: 'pending',
        priority: 'normal',
        assignedTo: ''
      });
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTask(null);
    setDialogMode('add');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
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
        const res = await fetch(`/api/tasks/${selectedTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
          fetchTasks();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to update task: ${errorData.error}`, severity: 'error' });
        }
      } else if (dialogMode === 'add') {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setSnackbar({ open: true, message: 'Task added successfully!', severity: 'success' });
          fetchTasks();
          handleClose();
        } else {
          const errorData = await res.json();
          setSnackbar({ open: true, message: `Failed to add task: ${errorData.error}`, severity: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setSnackbar({ open: true, message: 'An error occurred while saving the task.', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Task deleted successfully!', severity: 'success' });
        fetchTasks();
      } else {
        setSnackbar({ open: true, message: 'Failed to delete task.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbar({ open: true, message: 'An error occurred while deleting the task.', severity: 'error' });
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

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'normal': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'completed': return '#4caf50';
      default: return '#757575';
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography>Loading tasks...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={fetchTasks} sx={{ mt: 2 }}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Tasks ({filteredTasks.length} of {tasks.length})
            {statusFilter !== 'all' && ` - ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
          </Typography>
          <Button variant="contained" onClick={() => handleOpenDialog('add')}>Add Task</Button>
        </Box>
        
        {/* Status Filter Toggle Buttons */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(e, newStatus) => newStatus && handleStatusFilterChange(newStatus)}
            aria-label="task status filter"
          >
            <ToggleButton value="all" aria-label="all tasks">
              All Tasks
            </ToggleButton>
            <ToggleButton value="pending" aria-label="pending tasks">
              Pending
            </ToggleButton>
            <ToggleButton value="completed" aria-label="completed tasks">
              Completed
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <TextField
          label="Search Tasks"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
        
        {filteredTasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              {tasks.length === 0 ? 'No tasks found' : 'No tasks match your search and filter criteria'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                  }}
                >
                  <TableCell
                    onClick={() => handleSort('title')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Title {sortBy === 'title' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell
                    onClick={() => handleSort('dueDate')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Due Date {sortBy === 'dueDate' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('priority')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Priority {sortBy === 'priority' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell
                    onClick={() => handleSort('status')}
                    sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Status {sortBy === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                  </TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Assigned To</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedTasks.map(task => (
                  <TableRow
                    key={task.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenDialog('view', task)}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {task.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {task.description ? (
                        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.description}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(task.dueDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        sx={{
                          backgroundColor: getPriorityColor(task.priority),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        sx={{
                          backgroundColor: getStatusColor(task.status),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {task.assignedTo ? 
                        users.find(u => u.id === task.assignedTo)?.firstName + ' ' + users.find(u => u.id === task.assignedTo)?.lastName : 
                        '-'
                      }
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Button size="small" onClick={() => handleOpenDialog('edit', task)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(task.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Task Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {dialogMode === 'view' && selectedTask && 'Task Details'}
          {dialogMode === 'edit' && 'Edit Task'}
          {dialogMode === 'add' && 'Add New Task'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            {/* Row 1: Title */}
            <TextField
              name="title"
              label="Title"
              value={form.title}
              onChange={handleFormChange}
              required
              fullWidth
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 5,
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Row 2: Description */}
            <TextField
              name="description"
              label="Description"
              value={form.description}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              disabled={dialogMode === 'view'}
              sx={{ 
                mb: 5,
                '& .MuiInputBase-input.Mui-disabled': {
                  color: 'black',
                  WebkitTextFillColor: 'black'
                }
              }}
            />

            {/* Row 3: Due Date, Priority */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                name="dueDate"
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={dialogMode === 'view'}
                sx={{
                  '& .MuiInputBase-input.Mui-disabled': {
                    color: 'black',
                    WebkitTextFillColor: 'black'
                  }
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={form.priority}
                  label="Priority"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  {priorityOptions.map(priority => (
                    <MenuItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 4: Status, Assigned To */}
            <Box display="flex" gap={2} mb={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  name="assignedTo"
                  value={form.assignedTo}
                  label="Assigned To"
                  onChange={handleFormChange}
                  disabled={dialogMode === 'view'}
                  sx={{
                    '& .MuiSelect-select.Mui-disabled': {
                      color: 'black',
                      WebkitTextFillColor: 'black'
                    }
                  }}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'edit' ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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

export default Tasks;