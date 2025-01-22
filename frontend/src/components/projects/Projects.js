import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { ChromePicker } from 'react-color';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getProjects, createProject, updateProject, deleteProject } from '../../utils/api';
import { toast } from 'react-toastify';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    entity_classes: [],
  });
  const [newEntity, setNewEntity] = useState({ name: '', color: '#000000' });
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProjects = async () => {
      try {
        const data = await getProjects(abortController.signal);
        // Only update state if the component is still mounted and request wasn't aborted
        if (!abortController.signal.aborted) {
          setProjects(data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching projects:', error);
          toast.error('Error fetching projects');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    // Cleanup function to abort any pending requests when component unmounts
    return () => {
      abortController.abort();
    };
  }, []); // Empty dependency array since we only want to fetch once on mount

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectData({
        name: project.name,
        description: project.description,
        entity_classes: [...project.entity_classes],
      });
    } else {
      setEditingProject(null);
      setProjectData({
        name: '',
        description: '',
        entity_classes: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setProjectData({
      name: '',
      description: '',
      entity_classes: [],
    });
    setNewEntity({ name: '', color: '#000000' });
    setShowColorPicker(false);
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
    setNewEntity({ name: '', color: '#000000' });
    setShowColorPicker(false);
  };

  const handleRemoveEntity = (entityName) => {
    setProjectData({
      ...projectData,
      entity_classes: projectData.entity_classes.filter(e => e.name !== entityName),
    });
  };

  const handleSubmit = async () => {
    if (!projectData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        toast.success('Project updated successfully');
      } else {
        await createProject(projectData);
        toast.success('Project created successfully');
      }
      
      // Fetch projects with a new AbortController
      const abortController = new AbortController();
      try {
        const data = await getProjects(abortController.signal);
        setProjects(data);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error refreshing projects:', error);
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error(editingProject ? 'Error updating project' : 'Error creating project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        toast.success('Project deleted successfully');
        
        // Fetch projects with a new AbortController
        const abortController = new AbortController();
        try {
          const data = await getProjects(abortController.signal);
          setProjects(data);
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error('Error refreshing projects:', error);
          }
        }
      } catch (error) {
        toast.error('Error deleting project');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {project.name}
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {project.description}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {project.entity_classes.map((entity) => (
                    <Chip
                      key={entity.name}
                      label={entity.name}
                      size="small"
                      style={{ backgroundColor: entity.color }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/projects/${project.id}`)}>
                  View
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(project);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectData.name}
              onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Entity Classes
            </Typography>
            <Box sx={{ mb: 2 }}>
              {projectData.entity_classes.map((entity) => (
                <Chip
                  key={entity.name}
                  label={entity.name}
                  onDelete={() => handleRemoveEntity(entity.name)}
                  style={{ backgroundColor: entity.color, margin: '0 4px 4px 0' }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="New Entity Name"
                value={newEntity.name}
                onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                size="small"
              />
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  style={{
                    backgroundColor: newEntity.color,
                    minWidth: '64px',
                    minHeight: '40px',
                  }}
                />
                {showColorPicker && (
                  <Box sx={{ position: 'absolute', zIndex: 2 }}>
                    <Box
                      sx={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      }}
                      onClick={() => setShowColorPicker(false)}
                    />
                    <ChromePicker
                      color={newEntity.color}
                      onChange={(color) => setNewEntity({ ...newEntity, color: color.hex })}
                    />
                  </Box>
                )}
              </Box>
              <Button variant="contained" onClick={handleAddEntity}>
                Add Entity
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects;
