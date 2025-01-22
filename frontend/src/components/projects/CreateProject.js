import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { createProject } from '../../utils/api';
import { toast } from 'react-toastify';

const COLORS = [
  '#ffcdd2', // red
  '#c8e6c9', // green
  '#bbdefb', // blue
  '#fff9c4', // yellow
  '#e1bee7', // purple
  '#ffe0b2', // orange
  '#b2dfdb', // teal
  '#f8bbd0', // pink
];

const CreateProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [entityClass, setEntityClass] = useState('');
  const [entityClasses, setEntityClasses] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEntityClass = () => {
    if (!entityClass.trim()) return;
    
    const newClass = {
      name: entityClass.trim(),
      color: COLORS[entityClasses.length % COLORS.length],
    };
    
    setEntityClasses([...entityClasses, newClass]);
    setEntityClass('');
  };

  const handleRemoveEntityClass = (index) => {
    setEntityClasses(entityClasses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (entityClasses.length === 0) {
      toast.error('Please add at least one entity class');
      return;
    }

    try {
      await createProject({
        ...formData,
        entity_classes: entityClasses,
      });
      toast.success('Project created successfully!');
      navigate('/projects');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create project');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Create New Project
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Project Name"
              name="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Project Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
            
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Entity Classes
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  label="Add Entity Class"
                  value={entityClass}
                  onChange={(e) => setEntityClass(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEntityClass();
                    }
                  }}
                />
              </Grid>
              <Grid item>
                <IconButton
                  color="primary"
                  onClick={handleAddEntityClass}
                  size="large"
                >
                  <AddIcon />
                </IconButton>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {entityClasses.map((ec, index) => (
                <Chip
                  key={index}
                  label={ec.name}
                  onDelete={() => handleRemoveEntityClass(index)}
                  sx={{ backgroundColor: ec.color }}
                />
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/projects')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!formData.name || entityClasses.length === 0}
              >
                Create Project
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateProject;
