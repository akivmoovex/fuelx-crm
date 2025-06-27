import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
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
  TableRow,
  Grid,
  CircularProgress,
  Backdrop,
  SelectChangeEvent
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
  const [loading, setLoading] = useState(false);

  // Snackbar and dialog state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .finally(() => setLoading(false));
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setForm({ ...form, status: e.target.value });
  };

  const handleAddCustomer = async (formData: Omit<Customer, 'id'>) => {
    setLoading(true);
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const newCustomer = await res.json();
    setCustomers(prev => [...prev, newCustomer]);
    setLoading(false);
    setSnackbarMsg('Customer added successfully!');
    setSnackbarOpen(true);
  };

  const handleEditCustomer = async (id: string, formData: Omit<Customer, 'id'>) => {
    setLoading(true);
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const updatedCustomer = await res.json();
    setCustomers(prev =>
      prev.map(c => (c.id === id ? updatedCustomer : c))
    );
    setLoading(false);
    setSnackbarMsg('Customer updated successfully!');
    setSnackbarOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setLoading(true);
    await fetch(`/api/customers/${customerToDelete.id}`, { method: 'DELETE' });
    setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
    setLoading(false);
    setDeleteDialogOpen(false);
    setSnackbarMsg(`Customer "${customerToDelete.firstName} ${customerToDelete.lastName}" deleted.`);
    setSnackbarOpen(true);
    setCustomerToDelete(null);
    // If editing the deleted customer, reset form
    if (editingId === customerToDelete.id) {
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Paper sx={{ p: 4, mb: 4, maxWidth: "lg", mx: "auto", backgroundColor: '#f5f5f5' }}>
        <Typography variant="h5" gutterBottom>
          {editingId ? 'Edit Customer' : 'Add Customer'}
        </Typography>
        <Box component="form" onSubmit={handleFormSubmit} sx={{ flexGrow: 1, width: '100%' }}>
          <Grid container spacing={5}>
            {/* Row 1 */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="First Name"
                value={form.firstName}
                onChange={handleFormChange}
                required
                fullWidth
                sx={{ minWidth: 250 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Last Name"
                value={form.lastName}
                onChange={handleFormChange}
                required
                fullWidth
                sx={{ minWidth: 250 }}
              />
            </Grid>
            {/* Row 2 */}
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={handleFormChange}
                required
                fullWidth
                sx={{ minWidth: 250 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                value={form.email}
                onChange={handleFormChange}
                required
                fullWidth
                sx={{ minWidth: 250 }}
              />
            </Grid>
            {/* Row 3 */}
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleStatusChange}
                  required
                  fullWidth
                  sx={{ minWidth: 250 }}
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="source"
                label="Source"
                value={form.source}
                onChange={handleFormChange}
                required
                fullWidth
                sx={{ minWidth: 250 }}
              />
            </Grid>
            {/* Row 4 */}
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={form.notes}
                onChange={handleFormChange}
                fullWidth
                multiline
                minRows={2}
                sx={{ minWidth: 250 }}
              />
            </Grid>
            {/* Buttons */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary">
                {editingId ? 'Update Customer' : 'Add Customer'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditingId(null);
                  resetForm();
                }}>
                Cancel
              </Button>
            </Grid>
          </Grid>
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
                  <Button size="small" color="error" onClick={() => handleDeleteClick(customer)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </MuiAlert>
      </Snackbar>
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete customer{' '}
          <b>
            {customerToDelete?.firstName} {customerToDelete?.lastName}
          </b>
          ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Back
          </Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Customers;