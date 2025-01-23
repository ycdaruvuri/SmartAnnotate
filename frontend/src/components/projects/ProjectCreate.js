import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'react-toastify';
import HomeButton from '../common/HomeButton';

const COLOR_PALETTE = [
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#f44336',
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
  '#cddc39', '#795548', '#9e9e9e', '#607d8b',
];

const ProjectCreate = ({ 
  onClose, 
  onSubmit, 
  initialData = null,
  isEdit = false 
}) => {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    entity_classes: [],
  });

  const [newEntity, setNewEntity] = useState({ 
    name: '', 
    color: COLOR_PALETTE[0], 
    description: '' 
  });

  useEffect(() => {
    if (initialData) {
      setProjectData({
        name: initialData.name || '',
        description: initialData.description || '',
        entity_classes: initialData.entity_classes || [],
      });
    }
  }, [initialData]);

  const handleClose = () => {
    setProjectData({
      name: '',
      description: '',
      entity_classes: [],
    });
    setNewEntity({ name: '', color: COLOR_PALETTE[0], description: '' });
    onClose();
  };

  const handleAddEntity = () => {
    if (!newEntity.name.trim()) {
      toast.error('Entity name is required');
      return;
    }

    if (projectData.entity_classes.some(e => e.name === newEntity.name)) {
      toast.error('Entity with this name already exists');
      return;
    }

    setProjectData({
      ...projectData,
      entity_classes: [...projectData.entity_classes, { ...newEntity }],
    });
    
    // Reset new entity form with first available color
    const availableColors = getAvailableColors();
    setNewEntity({ 
      name: '', 
      color: availableColors[0] || COLOR_PALETTE[0], 
      description: '' 
    });
  };

  const handleRemoveEntity = (entityName) => {
    setProjectData({
      ...projectData,
      entity_classes: projectData.entity_classes.filter(e => e.name !== entityName),
    });
  };

  const handleSubmit = () => {
    if (!projectData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    onSubmit(projectData);
  };

  const getAvailableColors = (excludeColor = null) => {
    const usedColors = new Set(projectData.entity_classes.map(e => e.color));
    if (excludeColor) {
      usedColors.delete(excludeColor);
    }
    return COLOR_PALETTE.filter(color => !usedColors.has(color));
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <HomeButton />
      <Container maxWidth="md">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleClose} size="large">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {isEdit ? 'Edit Project' : 'New Project'}
          </Typography>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              label="Project Name"
              fullWidth
              required
              size="small"
              margin="normal"
              value={projectData.name}
              onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              size="small"
              rows={2}
              margin="normal"
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Entity Classes
            </Typography>

            {/* Existing Entities */}
            <Box sx={{ mb: 3 }}>
              {projectData.entity_classes.map((entity, index) => (
                <Paper 
                  key={index}
                  variant="outlined" 
                  sx={{ p: 2, mb: 2 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <TextField
                          size="small"
                          value={entity.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setProjectData(prev => ({
                              ...prev,
                              entity_classes: prev.entity_classes.map((e, i) => 
                                i === index ? { ...e, name: newName } : e
                              )
                            }));
                          }}
                          sx={{ flexGrow: 1 }}
                        />
                        <Select
                          size="small"
                          value={entity.color}
                          onChange={(e) => {
                            const newColor = e.target.value;
                            setProjectData(prev => ({
                              ...prev,
                              entity_classes: prev.entity_classes.map((e, i) => 
                                i === index ? { ...e, color: newColor } : e
                              )
                            }));
                          }}
                          sx={{ width: 120 }}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  backgroundColor: selected,
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              />
                              <Typography variant="body2">Current</Typography>
                            </Box>
                          )}
                        >
                          <MenuItem value={entity.color}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  backgroundColor: entity.color,
                                  border: '1px solid #ccc',
                                  borderRadius: '2px'
                                }}
                              />
                              <Typography variant="body2">Current</Typography>
                            </Box>
                          </MenuItem>
                          {getAvailableColors(entity.color).map((color) => (
                            <MenuItem key={color} value={color}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    backgroundColor: color,
                                    border: '1px solid #ccc',
                                    borderRadius: '2px'
                                  }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveEntity(entity.name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <TextField
                        size="small"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Add a description"
                        value={entity.description || ''}
                        onChange={(e) => {
                          const newDescription = e.target.value;
                          setProjectData(prev => ({
                            ...prev,
                            entity_classes: prev.entity_classes.map((e, i) => 
                              i === index ? { ...e, description: newDescription } : e
                            )
                          }));
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Add New Entity */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    placeholder="New Entity Name"
                    size="small"
                    value={newEntity.name}
                    onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newEntity.name.trim()) {
                        e.preventDefault();
                        handleAddEntity();
                      }
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <Select
                    size="small"
                    value={newEntity.color}
                    onChange={(e) => setNewEntity({ ...newEntity, color: e.target.value })}
                    sx={{ width: 120 }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: selected,
                            border: '1px solid #ccc',
                            borderRadius: '2px'
                          }}
                        />
                        <Typography variant="body2">Select Color</Typography>
                      </Box>
                    )}
                  >
                    {getAvailableColors().map((color) => (
                      <MenuItem key={color} value={color}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: color,
                              border: '1px solid #ccc',
                              borderRadius: '2px'
                            }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
                <TextField
                  placeholder="Description"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={newEntity.description || ''}
                  onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
                />
                <Button
                  variant="contained"
                  onClick={handleAddEntity}
                  disabled={!newEntity.name.trim()}
                >
                  Add Entity
                </Button>
              </Box>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="contained">
                {isEdit ? 'Update Project' : 'Create Project'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProjectCreate;
