import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import {
  Container,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const statusOptions = [
  'lead',
  'prospect',
  'customer',
  'inactive'
];

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: '',
    source: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = (e.target as HTMLInputElement).name;
    const value = (e.target as HTMLInputElement).value;
    setForm({ ...form, [name]: value });
  };

  const handleStatusChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setForm({ ...form, status: e.target.value as string });
  };

  const handleAddCustomer = async (formData: Omit<Customer, 'id'>) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const newCustomer = await res.json();
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleEditCustomer = async (id: string, formData: Omit<Customer, 'id'>) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const updatedCustomer = await res.json();
    setCustomers(prev =>
      prev.map(c => (c.id === id ? updatedCustomer : c))
    );
  };

  const handleDeleteCustomer = async (id: string) => {
    await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
    });
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (editingId === id) {
      setEditingId(null);
      resetForm();
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      status: customer.status,
      source: customer.source,
      notes: customer.notes
    });
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: '',
      source: '',
      notes: ''
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      handleEditCustomer(editingId, form as any);
      setEditingId(null);
    } else {
      handleAddCustomer(form as any);
    }
    resetForm();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {editingId ? 'Edit Customer' : 'Add Customer'}
        </Typography>
        <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            name="firstName"
            label="First Name"
            value={form.firstName}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            name="lastName"
            label="Last Name"
            value={form.lastName}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            name="email"
            label="Email"
            value={form.email}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            name="phone"
            label="Phone"
            value={form.phone}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            name="company"
            label="Company"
            value={form.company}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <FormControl required sx={{ flex: 1, minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={form.status}
              label="Status"
              onChange={handleStatusChange}
            >
              {statusOptions.map(option => (
                <MenuItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            name="source"
            label="Source"
            value={form.source}
            onChange={handleFormChange}
            required
            sx={{ flex: 1 }}
          />
          <TextField
            name="notes"
            label="Notes"
            value={form.notes}
            onChange={handleFormChange}
            sx={{ flex: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update Customer' : 'Add Customer'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell>{customer.firstName} {customer.lastName}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell>{customer.status}</TableCell>
                <TableCell>{customer.source}</TableCell>
                <TableCell>{customer.notes}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleEditClick(customer)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDeleteCustomer(customer.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Customers;