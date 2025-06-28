import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert
} from '@mui/material';
import { Save, Notifications, Security, Palette, Language } from '@mui/icons-material';

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    language: 'en',
    timezone: 'UTC'
  });

  const [saved, setSaved] = React.useState(false);

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked
    });
  };

  const handleSave = () => {
    // Save settings logic here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Settings
          </Typography>
        </Box>

        {saved && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Notifications Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<Notifications color="primary" />}
                title="Notifications"
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingChange('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <Box mt={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.pushNotifications}
                        onChange={handleSettingChange('pushNotifications')}
                      />
                    }
                    label="Push Notifications"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Appearance Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<Palette color="primary" />}
                title="Appearance"
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSettingChange('darkMode')}
                    />
                  }
                  label="Dark Mode"
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<Security color="primary" />}
                title="Security"
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Manage your account security settings
                </Typography>
                <Button variant="outlined" size="small">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Language & Region */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                avatar={<Language color="primary" />}
                title="Language & Region"
                titleTypographyProps={{ fontWeight: 'bold' }}
              />
              <CardContent>
                <TextField
                  select
                  label="Language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </TextField>
                <TextField
                  select
                  label="Timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  fullWidth
                  size="small"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                </TextField>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            size="large"
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;