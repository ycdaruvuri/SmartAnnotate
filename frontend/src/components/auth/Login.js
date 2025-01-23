import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login } from '../../utils/auth';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Login = () => {
  const navigate = useNavigate();
  const { setIsAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      setIsAuth(true);
      toast.success('Successfully logged in!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to login');
    }
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Grid container component={Paper} elevation={3} sx={{ height: '70vh' }}>
          {/* Left side - Logo and App Name */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fafafa',
              p: 4,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CheckCircleIcon
                  sx={{
                    fontSize: 40,
                    color: '#1976d2',
                  }}
                />
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    color: '#1976d2',
                    fontWeight: 'bold',
                  }}
                >
                  SmartAnnotator
                </Typography>
              </Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: '#666',
                  maxWidth: 400,
                  textAlign: 'center',
                  mt: 2,
                }}
              >
                Your intelligent document annotation platform
              </Typography>
            </Box>
          </Grid>

          {/* Right side - Login Form */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Sign In
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Don't have an account? Sign Up
                  </Typography>
                </Link>
              </Box>
            </form>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Login;
