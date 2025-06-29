import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea', // Indigo
      dark: '#5a6fd8',
      light: '#764ba2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#764ba2', // Purple
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: 'rgba(255,255,255,0.95)',
    },
    error: {
      main: '#f5576c',
    },
    success: {
      main: '#43e97b',
    },
    info: {
      main: '#4facfe',
    },
    warning: {
      main: '#ff9800',
    },
    text: {
      primary: '#222',
      secondary: '#666',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

export default theme;
