import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { createProject } from '../../utils/api';
import { toast } from 'react-toastify';
import { getNextColor } from '../../utils/colors';

const CreateProject = () => {
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    entity_classes: [],
  });
  const [newEntityName, setNewEntityName] = useState('');

  const handleAddEntity = () => {
    if (!newEntityName.trim()) {
      toast.error('Entity name is required');
      return;
    }

    if (projectData.entity_classes.some(e => e.name === newEntityName)) {
      toast.error('Entity with this name already exists');
      return;
    }

    const usedColors = projectData.entity_classes.map(e => e.color);
    const nextColor = getNextColor(usedColors);

    setProjectData({
      ...projectData,
      entity_classes: [...projectData.entity_classes, {
        name: newEntityName.trim(),
        color: nextColor,
      }],
    });
    setNewEntityName('');
  };

  const handleRemoveEntity = (entityName) => {
    setProjectData({
      ...projectData,
      entity_classes: projectData.entity_classes.filter(e => e.name !== entityName),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      await createProject(projectData);
      toast.success('Project created successfully');
      navigate('/projects');
    } catch (error) {
      toast.error('Error creating project');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Project
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Project Name"
            fullWidth
            required
            margin="normal"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            margin="normal"
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Entity Classes
          </Typography>

          <Box mb={2}>
            {projectData.entity_classes.map((entity) => (
              <Chip
                key={entity.name}
                label={entity.name}
                onDelete={() => handleRemoveEntity(entity.name)}
                style={{ backgroundColor: entity.color, margin: '0 4px 4px 0' }}
              />
            ))}
          </Box>

          <Box display="flex" gap={2} alignItems="center" mb={3}>
            <TextField
              label="New Entity Name"
              size="small"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newEntityName.trim()) {
                  e.preventDefault();
                  handleAddEntity();
                }
              }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddEntity}
              disabled={!newEntityName.trim()}
            >
              Add Entity
            </Button>
          </Box>

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button onClick={() => navigate('/projects')}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create Project
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateProject;
