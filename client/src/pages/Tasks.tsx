import React, { useState, useEffect } from 'react';
import { Task, User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';

const statusOptions = ['pending', 'completed'];
const priorityOptions = ['low', 'normal', 'high'];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending',
    priority: 'normal',
    assignedTo: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'title' | 'priority' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch tasks
  const fetchTasks = () => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsersList(data));
  }, []);

  const handleOpen = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setForm({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || ''
      });
    } else {
      setEditingTask(null);
      setForm({
        title: '',
        description: '',
        dueDate: '',
        status: 'pending',
        priority: 'normal',
        assignedTo: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTask(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
  };

  const handleStatusChange = (e: any) => setForm({ ...form, status: e.target.value });
  const handlePriorityChange = (e: any) => setForm({ ...form, priority: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert dueDate to ISO string if present and not already in ISO format
    let dueDate = form.dueDate;
    if (dueDate && !dueDate.includes('T')) {
      dueDate = new Date(dueDate).toISOString();
    }

    const payload = { ...form, dueDate };

    if (editingTask) {
      // Edit task
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Task updated!', severity: 'success' });
        fetchTasks();
      } else {
        setSnackbar({ open: true, message: 'Failed to update task.', severity: 'error' });
      }
    } else {
      // Add task
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'Task added!', severity: 'success' });
        fetchTasks();
      } else {
        setSnackbar({ open: true, message: 'Failed to add task.', severity: 'error' });
      }
    }
    setOpen(false);
    setEditingTask(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSnackbar({ open: true, message: 'Task deleted!', severity: 'success' });
      fetchTasks();
    } else {
      setSnackbar({ open: true, message: 'Failed to delete task.', severity: 'error' });
    }
  };

  // Filtering and sorting
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase()) ||
    (task.description || '').toLowerCase().includes(search.toLowerCase())
  );

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
      setSortDirection(column === 'dueDate' ? 'desc' : 'asc'); // Default: dueDate desc, others asc
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Tasks</Typography>
          <Button variant="contained" onClick={() => handleOpen()}>Add Task</Button>
        </Box>
        <TextField
          label="Search Tasks"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          fullWidth
        />
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
                  onClick={() => handleSort('status')}
                  sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Status {sortBy === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('priority')}
                  sx={{ color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Priority {sortBy === 'priority' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
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
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.actions-cell')) return;
                    handleOpen(task);
                  }}
                >
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>{task.dueDate ? task.dueDate.slice(0, 10) : ''}</TableCell>
                  <TableCell
                    sx={
                      task.status === 'pending'
                        ? { background: '#388e3c', color: '#fff', fontWeight: 'bold' }
                        : undefined
                    }
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </TableCell>
                  <TableCell
                    sx={
                      task.priority === 'high'
                        ? { background: '#d32f2f', color: '#fff', fontWeight: 'bold' }
                        : undefined
                    }
                  >
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </TableCell>
                  <TableCell>
                    {usersList.find(u => u.id === task.assignedTo)
                      ? `${usersList.find(u => u.id === task.assignedTo)?.firstName} ${usersList.find(u => u.id === task.assignedTo)?.lastName}`
                      : ''}
                  </TableCell>
                  <TableCell className="actions-cell" onClick={e => e.stopPropagation()}>
                    <Button size="small" onClick={() => handleOpen(task)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(task.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            color: '#fff',
            fontWeight: 'bold',
            mb: 2 // <-- This adds padding below the title
          }}
        >
          {editingTask ? 'Edit Task' : 'Add Task'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              name="title"
              label="Title"
              value={form.title}
              onChange={handleFormChange}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="description"
              label="Description"
              value={form.description}
              onChange={handleFormChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="dueDate"
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={handleFormChange}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={form.status}
                label="Status"
                onChange={handleStatusChange}
                required
              >
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Assigned To</InputLabel>
              <Select
                name="assignedTo"
                value={form.assignedTo}
                label="Assigned To"
                onChange={handleFormChange}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {usersList.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={form.priority}
                label="Priority"
                onChange={handlePriorityChange}
                required
              >
                {priorityOptions.map(priority => (
                  <MenuItem key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">{editingTask ? 'Update' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Tasks;