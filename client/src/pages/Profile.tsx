import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Avatar, Grid, Card, CardContent, 
  TextField, Button, Divider, Alert, Switch, FormControlLabel, 
  Tabs, Tab, Chip, IconButton, Tooltip, LinearProgress, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Snackbar
} from '@mui/material';
import {
  Save, Edit, Person, Notifications, Security, Palette, Language,
  Email, Phone, Business, LocationOn, CalendarToday, Badge,
  Visibility, VisibilityOff, Lock, Palette as PaletteIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import { formatDate } from '../utils/dateUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Profile data
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    department: '',
    position: user?.role || '',
    bio: '',
    location: '',
    website: ''
  });

  // Settings data
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'en',
    timezone: 'UTC',
    autoSave: true,
    compactMode: false
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      // API call to update profile
      await apiClient.put(`/api/users/${user?.id}`, profile);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to update profile', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setLoading(true);
      // API call to update settings
      await apiClient.put(`/api/users/${user?.id}/settings`, settings);
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to save settings', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(`/api/users/${user?.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to change password', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'error';
      case 'SALES_MANAGER': return 'warning';
      case 'SALES_REP': return 'info';
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Modern Header */}
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ width: 80, height: 80, mr: 3, border: '3px solid rgba(255,255,255,0.3)' }}>
              {user?.firstName?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {user?.email}
              </Typography>
              <Chip 
                label={user?.role?.replace('_', ' ')} 
                color={getRoleColor(user?.role || '') as any}
                size="small"
                sx={{ color: 'white' }}
              />
            </Box>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Profile & Settings
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Manage your account and preferences
            </Typography>
          </Box>
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
                <Person sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {user?.role?.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Your Role
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
                <Business sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user?.businessUnit?.tenant?.name || user?.tenant?.name || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tenant
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
                <Security sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {user?.status || 'Active'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Account Status
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
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatDate(user?.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Member Since
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Profile" icon={<Person />} iconPosition="start" />
          <Tab label="Settings" icon={<PaletteIcon />} iconPosition="start" />
          <Tab label="Security" icon={<Security />} iconPosition="start" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight="bold">
                      Personal Information
                    </Typography>
                    <Button
                      startIcon={editing ? <Save /> : <Edit />}
                      onClick={editing ? handleProfileSave : () => setEditing(true)}
                      variant={editing ? "contained" : "outlined"}
                      disabled={loading}
                    >
                      {editing ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="First Name"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Last Name"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Department"
                        value={profile.department}
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Position"
                        value={profile.position}
                        onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Location"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        fullWidth
                        disabled={!editing}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Bio"
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                        disabled={!editing}
                        placeholder="Tell us about yourself..."
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Account Information
                  </Typography>
                  
                  {/* Role */}
                  <Box mb={3}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Role
                    </Typography>
                    <Chip 
                      label={user?.role?.replace('_', ' ')} 
                      color={getRoleColor(user?.role || '') as any}
                      size="small"
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Status */}
                  <Box mb={3}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Status
                    </Typography>
                    <Chip 
                      label={user?.status || 'Active'} 
                      color={user?.status === 'active' ? 'success' : 'error'} 
                      size="small" 
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Member Since */}
                  <Box mb={3}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Member Since
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(user?.createdAt)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Last Login */}
                  <Box mb={3}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Last Login
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(user?.lastLoginAt)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Tenant */}
                  <Box mb={3}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Tenant
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user?.tenant?.name || user?.businessUnit?.tenant?.name || 'Not assigned'}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Business Unit */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Business Unit
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user?.businessUnit?.name || 'Not assigned'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      />
                    }
                    label="Email Notifications"
                  />
                  <Box mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.pushNotifications}
                          onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                        />
                      }
                      label="Push Notifications"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Appearance
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                      />
                    }
                    label="Dark Mode"
                  />
                  <Box mt={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.compactMode}
                          onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                        />
                      }
                      label="Compact Mode"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <Language sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Language & Region
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      label="Language"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      label="Timezone"
                    >
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="EST">Eastern Time</MenuItem>
                      <MenuItem value="PST">Pacific Time</MenuItem>
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Preferences
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoSave}
                        onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                      />
                    }
                    label="Auto-save Forms"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSettingsSave}
              disabled={loading}
              size="large"
            >
              Save Settings
            </Button>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Change Password
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Current Password"
                        type={passwordData.showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setPasswordData({ 
                                ...passwordData, 
                                showCurrentPassword: !passwordData.showCurrentPassword 
                              })}
                            >
                              {passwordData.showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="New Password"
                        type={passwordData.showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setPasswordData({ 
                                ...passwordData, 
                                showNewPassword: !passwordData.showNewPassword 
                              })}
                            >
                              {passwordData.showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirm New Password"
                        type={passwordData.showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => setPasswordData({ 
                                ...passwordData, 
                                showConfirmPassword: !passwordData.showConfirmPassword 
                              })}
                            >
                              {passwordData.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box mt={3}>
                    <Button
                      variant="contained"
                      startIcon={<Lock />}
                      onClick={handlePasswordChange}
                      disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      Change Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Security Tips
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      • Use a strong, unique password
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      • Enable two-factor authentication
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      • Keep your email secure
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      • Log out from shared devices
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

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

export default Profile;