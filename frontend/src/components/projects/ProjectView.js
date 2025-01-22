import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import {
  getProject,
  getProjectDocuments,
  createDocument,
  uploadDocument,
  exportProjectData,
  updateProject,
} from '../../utils/api';
import { toast } from 'react-toastify';
import { COLOR_PALETTE, getRandomUnusedColor } from '../../utils/colors';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newText, setNewText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedProject, setEditedProject] = useState({
    name: '',
    description: '',
    entity_classes: [],
  });
  const [newEntity, setNewEntity] = useState({ name: '', color: COLOR_PALETTE[0] });
  const [editingEntity, setEditingEntity] = useState(null);
  const [editingEntityName, setEditingEntityName] = useState('');

  const fetchProjectData = useCallback(async () => {
    try {
      const projectData = await getProject(projectId);
      setProject(projectData);
      setEditedProject({
        name: projectData.name || '',
        description: projectData.description || '',
        entity_classes: projectData.entity_classes || [],
      });

      const documentsData = await getProjectDocuments(projectId);
      setDocuments(documentsData || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Error fetching project data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId, fetchProjectData]);

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  const handleAddEntity = () => {
    if (!newEntity.name.trim()) {
      toast.error('Entity name cannot be empty');
      return;
    }

    if (editedProject.entity_classes.some(e => e.name === newEntity.name)) {
      toast.error('Entity with this name already exists');
      return;
    }

    const usedColors = editedProject.entity_classes.map(e => e.color);
    const randomColor = getRandomUnusedColor(usedColors);

    // Validate that the color is in the palette
    if (!COLOR_PALETTE.includes(randomColor)) {
      console.error('Invalid color generated:', randomColor);
      randomColor = COLOR_PALETTE[0];
    }

    setEditedProject({
      ...editedProject,
      entity_classes: [...editedProject.entity_classes, { 
        name: newEntity.name.trim(),
        color: randomColor
      }],
    });
    setNewEntity({ name: '', color: COLOR_PALETTE[0] });
  };

  const handleEditEntityStart = (entity) => {
    setEditingEntity(entity);
    setEditingEntityName(entity.name);
  };

  const handleEditEntitySave = () => {
    if (!editingEntityName.trim()) {
      toast.error('Entity name cannot be empty');
      return;
    }

    if (editingEntityName !== editingEntity.name && 
        editedProject.entity_classes.some(e => e.name === editingEntityName)) {
      toast.error('Entity with this name already exists');
      return;
    }

    const updatedEntities = editedProject.entity_classes.map(e => 
      e === editingEntity ? { ...e, name: editingEntityName.trim() } : e
    );

    setEditedProject({
      ...editedProject,
      entity_classes: updatedEntities,
      isComplete: false // Reset complete flag when entity is edited
    });

    setEditingEntity(null);
    setEditingEntityName('');
  };

  const handleChangeEntityColor = (entity, newColor) => {
    // Validate that the color is in the palette
    if (!COLOR_PALETTE.includes(newColor)) {
      toast.error('Invalid color selected');
      return;
    }

    const updatedEntities = editedProject.entity_classes.map(e => 
      e === entity ? { ...e, color: newColor } : e
    );

    setEditedProject({
      ...editedProject,
      entity_classes: updatedEntities
    });
  };

  const handleRandomColor = (entity) => {
    const usedColors = editedProject.entity_classes.map(e => e.color);
    const randomColor = getRandomUnusedColor(usedColors);

    // Validate that the color is in the palette
    if (!COLOR_PALETTE.includes(randomColor)) {
      console.error('Invalid color generated:', randomColor);
      randomColor = COLOR_PALETTE[0];
    }

    handleChangeEntityColor(entity, randomColor);
  };

  const handleRemoveEntity = (entityName) => {
    setEditedProject({
      ...editedProject,
      entity_classes: editedProject.entity_classes.filter(e => e.name !== entityName),
      isComplete: false // Reset complete flag when entity is removed
    });
  };

  const handleSaveProject = async () => {
    if (!editedProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      await updateProject(projectId, editedProject);
      setProject({ ...project, ...editedProject });
      toast.success('Project updated successfully');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Error updating project');
    }
  };

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleCreateDocument = async () => {
    if (!newText.trim()) {
      toast.error('Please enter document text');
      return;
    }

    try {
      const response = await createDocument({
        project_id: projectId,
        text: newText,
      });
      setDocuments([...documents, response]);
      setNewText('');
      setOpenDialog(false);
      toast.success('Document created successfully');
    } catch (error) {
      toast.error('Error creating document');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadDocument(projectId, file);
      setDocuments([...documents, response]);
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportProjectData(projectId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name || 'project'}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to export project data');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Project not found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/projects')}
            sx={{ mt: 2 }}
          >
            Back to Projects
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="h4">
                {project.name}
              </Typography>
              <IconButton
                onClick={handleEditProject}
                size="small"
                sx={{ ml: 1 }}
                aria-label="edit project settings"
              >
                <EditIcon />
              </IconButton>
            </Box>
            <Typography color="textSecondary" paragraph>
              {project.description}
            </Typography>
            <Box display="flex" gap={1}>
              {project.entity_classes?.map((ec) => (
                <Chip
                  key={ec.name}
                  label={ec.name}
                  size="small"
                  style={{ backgroundColor: ec.color }}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="module" aria-label="module view">
                <ViewModuleIcon />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Document
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            component="label"
            disabled={uploading}
          >
            Upload Document
            <input
              type="file"
              hidden
              onChange={handleFileUpload}
              accept=".txt,.doc,.docx"
            />
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Data
          </Button>
        </Box>

        {viewMode === 'grid' && (
          <Grid container spacing={3}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
                        {doc.name || 'Untitled Document'}
                      </Typography>
                      {doc.status === 'completed' && (
                        <Chip 
                          label="Completed" 
                          size="small" 
                          color="success" 
                          sx={{ minWidth: 90 }}
                        />
                      )}
                    </Box>
                    <Typography color="textSecondary" noWrap>
                      {doc.text?.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/annotate/${doc.id}`)}
                    >
                      Annotate
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {viewMode === 'list' && (
          <List>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                button
                onClick={() => navigate(`/annotate/${doc.id}`)}
                divider
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {doc.name || 'Untitled Document'}
                      </Typography>
                      {doc.status === 'completed' && (
                        <Chip 
                          label="Completed" 
                          size="small" 
                          color="success" 
                          sx={{ minWidth: 90 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={doc.text?.substring(0, 100) + '...'}
                />
                <Button size="small" color="primary">
                  Annotate
                </Button>
              </ListItem>
            ))}
          </List>
        )}

        {viewMode === 'module' && (
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} key={doc._id}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6">{doc.name || 'Untitled Document'}</Typography>
                  <Typography paragraph>{doc.text?.substring(0, 200)}...</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/annotate/${doc._id}`)}
                  >
                    Annotate
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {documents.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              No documents found. Create a new document or upload one to get started.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* New Document Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Document Text"
            fullWidth
            multiline
            rows={4}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDocument} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project Settings</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={editedProject.name}
            onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editedProject.description}
            onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
          />

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Entity Classes
          </Typography>

          <List>
            {editedProject.entity_classes.map((entity) => (
              <ListItem
                key={entity.name}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {editingEntity === entity ? (
                  <>
                    <TextField
                      size="small"
                      value={editingEntityName}
                      onChange={(e) => setEditingEntityName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEditEntitySave();
                        }
                      }}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      size="small"
                      onClick={handleEditEntitySave}
                      sx={{ ml: 1 }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography sx={{ flexGrow: 1 }}>{entity.name}</Typography>
                    <Box display="flex" alignItems="center">
                      <Select
                        size="small"
                        value={COLOR_PALETTE.includes(entity.color) ? entity.color : COLOR_PALETTE[0]}
                        onChange={(e) => handleChangeEntityColor(entity, e.target.value)}
                        sx={{ width: 100, mr: 1 }}
                      >
                        {COLOR_PALETTE.map((color) => (
                          <MenuItem 
                            key={color} 
                            value={color}
                            sx={{ 
                              bgcolor: color,
                              '&:hover': { bgcolor: color },
                              '&.Mui-selected': { bgcolor: color },
                              '&.Mui-selected:hover': { bgcolor: color }
                            }}
                          >
                            &nbsp;
                          </MenuItem>
                        ))}
                      </Select>
                      <IconButton
                        size="small"
                        onClick={() => handleRandomColor(entity)}
                        title="Pick random color"
                        sx={{ mr: 1 }}
                      >
                        <PaletteIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditEntityStart(entity)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveEntity(entity.name)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </>
                )}
              </ListItem>
            ))}
          </List>

          <Box display="flex" gap={2} alignItems="center" mt={2}>
            <TextField
              label="New Entity Name"
              size="small"
              value={newEntity.name}
              onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newEntity.name.trim()) {
                  e.preventDefault();
                  handleAddEntity();
                }
              }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddEntity}
              disabled={!newEntity.name.trim()}
            >
              Add Entity
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProject} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectView;
