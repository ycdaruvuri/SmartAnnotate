import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Visibility, VisibilityOff, PhotoCamera } from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const UserSettings = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    about_me: '',
    profile_picture: null
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/profile`);
      setProfile(response.data);
      if (response.data.profile_picture) {
        setPreviewImage(`${API_URL}/uploads/profile_pictures/${response.data.profile_picture}`);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (profile.username) formData.append('username', profile.username);
    if (profile.email) formData.append('email', profile.email);
    if (profile.about_me) formData.append('about_me', profile.about_me);
    
    try {
      const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update profile' 
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/users/change-password`, {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      setMessage({ type: 'success', text: response.data.message });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to update password' 
      });
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setOpenConfirmDialog(true);
    }
  };

  const handleImageUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);
      
      try {
        const response = await axios.put(`${API_URL}/api/users/profile`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setMessage({ type: 'success', text: response.data.message });
        setOpenConfirmDialog(false);
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.detail || 'Failed to update profile picture' 
        });
        setOpenConfirmDialog(false);
        // Reset preview if upload fails
        fetchProfile();
      }
    }
  };

  const handleCancelUpload = () => {
    setOpenConfirmDialog(false);
    setSelectedFile(null);
    // Reset preview to current profile picture
    fetchProfile();
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <PageLayout title="User Settings">
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={previewImage}
                sx={{ width: 150, height: 150, mb: 2, mx: 'auto' }}
              />
              <input
                accept="image/*"
                type="file"
                id="icon-button-file"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="icon-button-file">
                <IconButton
                  color="primary"
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 0,
                    backgroundColor: 'background.paper'
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
            </Box>
            <Typography variant="h6" gutterBottom>Profile Picture</Typography>
            <Typography variant="body2" color="textSecondary">
              Click the camera icon to update your profile picture
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            <Box component="form" onSubmit={handleProfileUpdate}>
              <TextField
                fullWidth
                label="Username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="About Me"
                value={profile.about_me}
                onChange={(e) => setProfile({ ...profile, about_me: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Update Profile
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>Change Password</Typography>
            <Box component="form" onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword.current ? 'text' : 'password'}
                value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => togglePasswordVisibility('current')}>
                        {showPassword.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="New Password"
                type={showPassword.new ? 'text' : 'password'}
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => togglePasswordVisibility('new')}>
                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword.confirm ? 'text' : 'password'}
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                        {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onClose={handleCancelUpload}>
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to update your profile picture?
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Avatar
              src={previewImage}
              sx={{ width: 200, height: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpload}>Cancel</Button>
          <Button onClick={handleImageUpload} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
};

export default UserSettings;
