import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  TextField,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Chip,
  IconButton,
} from '@mui/material';
import {
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getDocument, updateDocument, getProject, getProjectDocuments } from '../../utils/api';

const AnnotationTool = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [nextDocId, setNextDocId] = useState(null);
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedEntityIndex, setFocusedEntityIndex] = useState(null);
  const textContentRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // First get the document to get its project_id
      const doc = await getDocument(documentId);
      console.log('Raw document data:', doc);
      
      // Then fetch project data and documents in parallel
      const [projectData, projectDocs] = await Promise.all([
        getProject(doc.project_id),
        getProjectDocuments(doc.project_id)
      ]);

      if (!projectData) {
        toast.error('Project data not found');
        navigate('/projects');
        return;
      }

      // Update entity colors based on project entity classes
      const updatedEntities = (doc.annotations || []).map(annotation => ({
        start: annotation.start_index,
        end: annotation.end_index,
        label: annotation.entity,
        text: annotation.text,
        color: projectData.entity_classes.find(ec => ec.name === annotation.entity)?.color || '#ffeb3b'
      }));

      console.log('Loaded entities:', updatedEntities);

      setProjectData(projectData);
      setDocData(doc);
      setEntities(updatedEntities);
      setProjectDocuments(projectDocs);
      
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Error loading document');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleKeyPress = useCallback((e) => {
    if (e.key >= '1' && e.key <= '9') {
      const index = parseInt(e.key) - 1;
      if (projectData?.entity_classes[index]) {
        setSelectedEntity(projectData.entity_classes[index]);
      }
    }
  }, [projectData]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleEntityClick = useCallback((e, index) => {
    e.stopPropagation();
    setFocusedEntityIndex(index);
    setAnchorEl(e.currentTarget);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setAnchorEl(null);
    setFocusedEntityIndex(null);
  }, []);

  const removeEntity = useCallback((index) => {
    setEntities(prev => prev.filter((_, i) => i !== index));
    handlePopoverClose();
  }, [handlePopoverClose]);

  const handleClassChange = useCallback((entityClass) => {
    if (focusedEntityIndex !== null) {
      setEntities(prev => prev.map((entity, index) => {
        if (index === focusedEntityIndex) {
          return {
            ...entity,
            label: entityClass.name,
            color: entityClass.color
          };
        }
        return entity;
      }));
    }
    handlePopoverClose();
  }, [focusedEntityIndex, handlePopoverClose]);

  const handleTextSelection = useCallback(() => {
    if (!selectedEntity) return;

    const selection = window.getSelection();
    if (!selection.toString().trim()) return;

    const range = selection.getRangeAt(0);
    const textContent = textContentRef.current;

    if (!textContent.contains(range.startContainer) || !textContent.contains(range.endContainer)) {
      return;
    }

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textContent);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const end = start + range.toString().length;

    const newEntity = {
      start,
      end,
      label: selectedEntity.name,
      text: selection.toString(),
      color: selectedEntity.color
    };

    console.log('New entity:', newEntity);
    setEntities(prev => [...prev, newEntity]);
    selection.removeAllRanges();
  }, [selectedEntity]);

  const handleSave = useCallback(async () => {
    try {
      const annotations = entities.map(entity => ({
        start_index: entity.start,
        end_index: entity.end,
        entity: entity.label,
        text: entity.text
      }));

      console.log('Saving annotations:', annotations);
      await updateDocument(documentId, { annotations });
      
      toast.success('Annotations saved successfully');
      
      if (nextDocId) {
        navigate(`/annotate/${nextDocId}`);
        setNextDocId(null);
        setOpenConfirm(false);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error('Failed to save annotations');
    }
  }, [documentId, entities, navigate, nextDocId]);

  const navigateDocument = useCallback((direction) => {
    const currentIndex = projectDocuments.findIndex(doc => doc.id === documentId);
    const nextIndex = currentIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < projectDocuments.length) {
      if (entities.length > 0) {
        setNextDocId(projectDocuments[nextIndex].id);
        setOpenConfirm(true);
      } else {
        navigate(`/annotate/${projectDocuments[nextIndex].id}`);
      }
    }
  }, [documentId, entities.length, navigate, projectDocuments]);

  const renderedText = useMemo(() => {
    if (!docData?.text) return null;

    const text = docData.text;
    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);
    const result = [];
    let lastIndex = 0;

    console.log('Rendering text with entities:', sortedEntities);

    sortedEntities.forEach((entity, index) => {
      if (entity.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, entity.start)}
          </span>
        );
      }

      result.push(
        <mark
          key={`entity-${index}`}
          style={{
            backgroundColor: entity.color,
            padding: '2px 4px',
            margin: '0 1px',
            borderRadius: '3px',
            cursor: 'pointer',
            position: 'relative',
            display: 'inline-block'
          }}
          onClick={(e) => handleEntityClick(e, index)}
        >
          {text.slice(entity.start, entity.end)}
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              padding: 0,
              width: '16px',
              height: '16px',
              minWidth: '16px',
              minHeight: '16px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                opacity: 1,
              },
              'mark:hover &': {
                opacity: 1,
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              removeEntity(index);
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </mark>
      );

      lastIndex = entity.end;
    });

    if (lastIndex < text.length) {
      result.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return result;
  }, [docData?.text, entities, handleEntityClick, removeEntity]);

  const filteredClasses = useMemo(() => {
    if (!projectData) return [];
    return projectData.entity_classes.filter(ec =>
      ec.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectData, searchTerm]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Document Annotation</Typography>
          <Box>
            <Button
              startIcon={<NavigateBeforeIcon />}
              onClick={() => navigateDocument(-1)}
              disabled={!projectDocuments.length || projectDocuments.findIndex(doc => doc.id === documentId) === 0}
            >
              Previous
            </Button>
            <Button
              endIcon={<NavigateNextIcon />}
              onClick={() => navigateDocument(1)}
              disabled={!projectDocuments.length || projectDocuments.findIndex(doc => doc.id === documentId) === projectDocuments.length - 1}
            >
              Next
            </Button>
            <Button
              startIcon={<SaveIcon />}
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ ml: 2 }}
            >
              Save
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Entity Classes (1-9 keys to select):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {projectData?.entity_classes.map((ec, index) => (
              <Chip
                key={index}
                label={`${index + 1}. ${ec.name}`}
                sx={{
                  backgroundColor: ec.color,
                  cursor: 'pointer',
                  border: selectedEntity?.name === ec.name ? '2px solid black' : 'none',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                onClick={() => setSelectedEntity(ec)}
              />
            ))}
          </Box>
        </Box>

        <Box
          ref={textContentRef}
          sx={{
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            minHeight: '200px',
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f5f5',
            cursor: 'text',
            lineHeight: 1.8,
            '& mark': {
              textDecoration: 'none',
            },
          }}
          onMouseUp={handleTextSelection}
        >
          {renderedText}
        </Box>
      </Paper>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
      >
        <DialogTitle>Save Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to save your changes before moving to the next document?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenConfirm(false);
            if (nextDocId) navigate(`/annotate/${nextDocId}`);
          }}>
            Don't Save
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1, width: 250 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List dense>
            {filteredClasses.map((ec, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleClassChange(ec)}
              >
                <ListItemText
                  primary={ec.name}
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        width: 16,
                        height: 16,
                        backgroundColor: ec.color,
                        display: 'inline-block',
                        borderRadius: '50%',
                        marginRight: 1,
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Container>
  );
};

export default AnnotationTool;
