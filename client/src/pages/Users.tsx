import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert
} from '@mui/material';

const roleOptions = ['admin', 'manager', 'sales', 'support'];
const statusOptions = ['active', 'inactive'];

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'sales',
    status: 'active',
    password: ''
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const handleOpen = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '' // Do not prefill password for security
      });
    } else {
      setEditingUser(null);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'sales',
        status: 'active',
        password: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
  };

  const handleRoleChange = (e: any) => setForm({ ...form, role: e.target.value });
  const handleStatusChange = (e: any) => setForm({ ...form, status: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Edit user
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map(u => (u.id === updated.id ? updated : u)));
        setSnackbar({ open: true, message: 'User updated!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to update user.', severity: 'error' });
      }
    } else {
      // Add user
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setSnackbar({ open: true, message: 'User added!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to add user.', severity: 'error' });
      }
    }
    setOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
      setSnackbar({ open: true, message: 'User deleted!', severity: 'success' });
    } else {
      setSnackbar({ open: true, message: 'Failed to delete user.', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Users</Typography>
          <Button variant="contained" onClick={() => handleOpen()}>Add User</Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleOpen(user)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(user.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              name="firstName"
              label="First Name"
              value={form.firstName}
              onChange={handleFormChange}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={form.lastName}
              onChange={handleFormChange}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="email"
              label="Email"
              value={form.email}
              onChange={handleFormChange}
              required
              fullWidth
              sx={{ mb: 2 }}
              type="email"
            />
            <TextField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleFormChange}
              required={!editingUser} // Only required when adding
              fullWidth
              type="password"
              sx={{ mb: 2 }}
              autoComplete="new-password"
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={form.role}
                label="Role"
                onChange={handleRoleChange}
                required
              >
                {roleOptions.map(role => (
                  <MenuItem key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
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
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">{editingUser ? 'Update' : 'Add'}</Button>
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

export default Users;