import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
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
  IconButton,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { getDocument, updateDocument, getProjectDocuments, getProject } from '../../utils/api';
import { toast } from 'react-toastify';

const AnnotationTool = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [docData, setDocData] = useState(null);
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [nextDocId, setNextDocId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedEntityRef, setFocusedEntityRef] = useState(null);
  const textContentRef = useRef(null);

  const handleKeyPress = useCallback((event) => {
    // Skip if we're in a text input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Handle both regular number keys and numpad keys
    let key = event.key;
    
    // Convert numpad keys to regular numbers
    if (key.startsWith('Numpad')) {
      key = key.replace('Numpad', '');
    }
    
    if (docData?.project?.entity_classes) {
      const numKey = parseInt(key);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        const index = numKey - 1;
        if (index < docData.project.entity_classes.length) {
          event.preventDefault(); // Prevent any default behavior
          setSelectedEntity(docData.project.entity_classes[index]);
          // Show a toast notification to indicate the selected class
          toast.info(`Selected: ${docData.project.entity_classes[index].name}`, {
            autoClose: 800 // Even shorter duration for this notification
          });
        }
      }
    }
  }, [docData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const doc = await getDocument(documentId);
      console.log('Document data:', doc);
      
      if (!doc) {
        toast.error('Document not found');
        navigate('/projects');
        return;
      }

      // Get project data if not included in document
      let projectData = doc.project;
      if (!projectData && doc.project_id) {
        try {
          projectData = await getProject(doc.project_id);
          doc.project = projectData;
        } catch (error) {
          console.error('Error fetching project:', error);
          toast.error('Error loading project data');
          return;
        }
      }

      if (!projectData) {
        toast.error('Project data not found');
        navigate('/projects');
        return;
      }

      setDocData(doc);
      setEntities(doc.entities || []);
      
      // Fetch other documents from the same project
      if (doc.project_id) {
        try {
          const docs = await getProjectDocuments(doc.project_id);
          setProjectDocuments(docs);
        } catch (error) {
          console.error('Error fetching project documents:', error);
          toast.error('Error loading project documents');
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      if (error.response?.status === 404) {
        toast.error('Document not found');
      } else if (error.response?.status === 403) {
        toast.error('Not authorized to access this document');
      } else {
        toast.error('Error loading document');
      }
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate]);

  useEffect(() => {
    if (!documentId) {
      toast.error('No document ID provided');
      navigate('/projects');
      return;
    }
    fetchData();
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [documentId, fetchData, navigate]);

  const handleTextSelection = () => {
    if (!selectedEntity) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (!text) return;
    
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textContentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const newEntity = {
      start,
      end: start + text.length,
      label: selectedEntity.name,
      text,
      color: selectedEntity.color,
    };

    setEntities([...entities, newEntity].sort((a, b) => a.start - b.start));
    selection.removeAllRanges();
  };

  const handleWordClick = useCallback((event) => {
    if (!selectedEntity) return;

    const word = event.target.innerText;
    const textContent = textContentRef.current.innerText;
    const start = textContent.indexOf(word);

    if (start === -1) return;

    const newEntity = {
      start,
      end: start + word.length,
      label: selectedEntity.name,
      text: word,
      color: selectedEntity.color,
    };

    setEntities([...entities, newEntity].sort((a, b) => a.start - b.start));
  }, [selectedEntity, entities]);

  const removeEntity = useCallback((index) => {
    setEntities(entities.filter((_, i) => i !== index));
  }, [entities]);

  const handleEntityClick = (event, index) => {
    event.stopPropagation();
    setFocusedEntityRef(event.currentTarget);
    setSelectedEntityIndex(index);
    setAnchorEl(event.currentTarget);
  };

  const handleClassChange = (newClass) => {
    if (selectedEntityIndex === null) return;

    const updatedEntities = [...entities];
    updatedEntities[selectedEntityIndex] = {
      ...updatedEntities[selectedEntityIndex],
      label: newClass.name,
      color: newClass.color,
    };
    setEntities(updatedEntities);
    handlePopoverClose();
  };

  const handlePopoverClose = () => {
    if (focusedEntityRef) {
      // Return focus to the entity that was clicked
      setTimeout(() => {
        focusedEntityRef.focus();
      }, 0);
    }
    setAnchorEl(null);
    setSelectedEntityIndex(null);
    setSearchTerm('');
    setFocusedEntityRef(null);
  };

  const handleSave = async () => {
    if (!docData) return;

    try {
      await updateDocument(documentId, {
        ...docData,
        entities,
        status: 'completed',
      });
      toast.success('Annotations saved successfully!');
      
      if (nextDocId) {
        navigate(`/annotate/${nextDocId}`);
      } else {
        setOpenConfirm(false);
        navigate(`/projects/${docData.project_id}`);
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error('Failed to save annotations');
    }
  };

  const navigateDocument = (direction) => {
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
  };

  const renderText = useCallback(() => {
    if (!docData?.text) return '';

    let text = docData.text;
    let result = [];
    let lastIndex = 0;

    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

    sortedEntities.forEach((entity, index) => {
      if (entity.start > lastIndex) {
        result.push(
          <span key={`text-${index}`} onDoubleClick={handleWordClick}>
            {text.slice(lastIndex, entity.start)}
          </span>
        );
      }

      result.push(
        <Box
          component="mark"
          key={`entity-${index}`}
          sx={{
            backgroundColor: entity.color,
            padding: '0 2px',
            borderRadius: '3px',
            position: 'relative',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
            '&:focus': {
              outline: '2px solid #000',
              outlineOffset: '2px',
            },
          }}
          onClick={(e) => handleEntityClick(e, index)}
          tabIndex={0}
          role="button"
          aria-label={`${entity.text} (${entity.label})`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleEntityClick(e, index);
            }
          }}
        >
          {text.slice(entity.start, entity.end)}
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              padding: 0,
              width: '12px',
              height: '12px',
              minWidth: '12px',
              minHeight: '12px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              removeEntity(index);
            }}
            aria-label={`Remove ${entity.label} annotation`}
          >
            <CloseIcon sx={{ fontSize: 8 }} />
          </IconButton>
        </Box>
      );

      lastIndex = entity.end;
    });

    if (lastIndex < text.length) {
      result.push(
        <span key="text-end" onDoubleClick={handleWordClick}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return result;
  }, [docData, entities]);

  const filteredClasses = docData?.project?.entity_classes.filter(ec =>
    ec.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!docData || !docData.project) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Document not found or failed to load
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Document Annotation</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={() => navigateDocument(-1)}
            >
              Previous
            </Button>
            <Button
              variant="outlined"
              endIcon={<NavigateNextIcon />}
              onClick={() => navigateDocument(1)}
            >
              Next
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                setNextDocId(null);
                setOpenConfirm(true);
              }}
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
            {docData.project.entity_classes.map((ec, index) => (
              <Chip
                key={index}
                label={`${index + 1}. ${ec.name}`}
                sx={{
                  backgroundColor: ec.color,
                  cursor: 'pointer',
                  border: selectedEntity?.name === ec.name ? '2px solid black' : 'none',
                }}
                onClick={() => setSelectedEntity(ec)}
              />
            ))}
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            cursor: 'text',
            lineHeight: 1.8,
          }}
        >
          <div
            id="text-content"
            ref={textContentRef}
            onMouseUp={handleTextSelection}
          >
            {renderText()}
          </div>
        </Paper>
      </Paper>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        aria-labelledby="save-dialog-title"
        disablePortal={false}
        keepMounted={false}
      >
        <DialogTitle id="save-dialog-title">Save Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to save your changes before moving to the next document?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenConfirm(false);
              if (nextDocId) navigate(`/annotate/${nextDocId}`);
            }}
            aria-label="Discard changes and continue"
          >
            Don't Save
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            aria-label="Save changes and continue"
          >
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
        slotProps={{
          paper: {
            sx: { 
              width: 200, // Even smaller width
              '& .MuiListItem-root': {
                py: 0.25, // Even less padding
                minHeight: '24px', // Smaller minimum height
              },
              '& .MuiListItemText-primary': {
                fontSize: '0.75rem', // Even smaller font (12px)
              },
            },
            elevation: 8,
            'aria-label': 'Change entity class',
          },
        }}
        keepMounted={false}
        disablePortal={false}
        disableAutoFocus={false}
        disableEnforceFocus={false}
        disableRestoreFocus={false}
      >
        <Box 
          sx={{ p: 0.5 }} // Even less padding
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handlePopoverClose();
            }
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '0.75rem' }} />
                </InputAdornment>
              ),
              sx: {
                fontSize: '0.75rem', // Smaller font size for input
                '& .MuiInputBase-input': {
                  padding: '4px 8px', // Smaller padding
                },
              },
            }}
            sx={{ mb: 0.25 }} // Less margin
            aria-label="Search entity classes"
          />
          <List 
            sx={{ 
              maxHeight: 200, // Smaller max height
              overflow: 'auto',
              '& .MuiListItem-root': {
                minHeight: '24px', // Smaller minimum height
              },
            }}
            role="listbox"
            aria-label="Entity classes list"
            dense
          >
            {filteredClasses.map((ec, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleClassChange(ec)}
                sx={{
                  '&:hover': {
                    backgroundColor: `${ec.color}40`,
                  },
                }}
                role="option"
                aria-selected={selectedEntity?.name === ec.name}
                dense
              >
                <ListItemText 
                  primary={`${index + 1}. ${ec.name}`}
                  primaryTypographyProps={{ 
                    fontSize: '0.75rem',
                    lineHeight: 1.1,
                  }}
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: ec.color,
                        display: 'inline-block',
                        borderRadius: '50%',
                        marginRight: 1,
                      }}
                      role="presentation"
                      aria-hidden="true"
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
