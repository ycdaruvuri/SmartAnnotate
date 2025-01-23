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
  IconButton,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getProjects, createProject, updateProject, deleteProject } from '../../utils/api';
import { toast } from 'react-toastify';
import HomeButton from '../common/HomeButton';
import ProjectCreate from './ProjectCreate';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectCreate, setShowProjectCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProjects = async () => {
      try {
        const data = await getProjects(abortController.signal);
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

    return () => {
      abortController.abort();
    };
  }, []);

  const handleOpenProjectCreate = (project = null) => {
    setEditingProject(project);
    setShowProjectCreate(true);
  };

  const handleCloseProjectCreate = () => {
    setShowProjectCreate(false);
    setEditingProject(null);
  };

  const handleSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        toast.success('Project updated successfully');
      } else {
        await createProject(projectData);
        toast.success('Project created successfully');
      }
      
      const data = await getProjects();
      setProjects(data);
      handleCloseProjectCreate();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(editingProject ? 'Error updating project' : 'Error creating project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        toast.success('Project deleted successfully');
        
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error deleting project:', error);
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

  if (showProjectCreate) {
    return (
      <ProjectCreate
        onClose={handleCloseProjectCreate}
        onSubmit={handleSubmit}
        initialData={editingProject}
        isEdit={!!editingProject}
      />
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <HomeButton />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4">Projects</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProjectCreate()}
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
                      handleOpenProjectCreate(project);
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
      </Container>
    </Box>
  );
};

export default Projects;
