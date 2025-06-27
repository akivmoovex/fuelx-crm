import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Box, Typography, Avatar, Paper } from '@mui/material';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper sx={{ p: 4, minWidth: 320 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ width: 64, height: 64, mb: 2 }}>
            {user?.firstName?.[0] || 'U'}
          </Avatar>
          <Typography variant="h5">{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="body1" color="text.secondary">{user?.role}</Typography>
        </Box>
        <Typography variant="body2"><b>Email:</b> {user?.email}</Typography>
        <Typography variant="body2"><b>Company:</b> {user?.company || 'Your Company'}</Typography>
      </Paper>
    </Box>
  );
};

export default Profile;
