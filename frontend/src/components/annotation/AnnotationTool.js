import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Popover,
  FormControl,
  Select,
  MenuItem,
  Stack,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getDocument,
  updateDocument,
  getProject,
  getProjectDocuments,
} from '../../utils/api';
import HomeButton from '../common/HomeButton';

const AnnotationTool = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [docData, setDocData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedEntityIndex, setFocusedEntityIndex] = useState(null);
  const [autoSave, setAutoSave] = useState(false);
  const [unsavedDocuments, setUnsavedDocuments] = useState(new Set());
  const [documentAnnotations, setDocumentAnnotations] = useState(new Map());
  const [documentStates, setDocumentStates] = useState(new Map());
  const [documentDataMap, setDocumentDataMap] = useState(new Map());
  const [documentTexts, setDocumentTexts] = useState(new Map());
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const textContentRef = React.useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const doc = await getDocument(documentId);
      console.log('Raw document data:', doc);
      
      const [projectData, projectDocs] = await Promise.all([
        getProject(doc.project_id),
        getProjectDocuments(doc.project_id)
      ]);

      if (!projectData) {
        toast.error('Project data not found');
        navigate('/projects');
        return;
      }

      setDocumentDataMap(prev => {
        const newMap = new Map(prev);
        newMap.set(doc.id, {
          text: doc.text,
          project_id: doc.project_id,
          status: doc.status
        });
        return newMap;
      });

      setDocumentTexts(prev => {
        const newMap = new Map(prev);
        newMap.set(doc.id, doc.text);
        return newMap;
      });

      let updatedEntities;
      if (documentAnnotations.has(doc.id)) {
        updatedEntities = documentAnnotations.get(doc.id);
        console.log('Using stored annotations:', updatedEntities);
      } else {
        updatedEntities = (doc.annotations || []).map(annotation => ({
          start: annotation.start_index,
          end: annotation.end_index,
          label: annotation.entity,
          text: annotation.text,
          color: projectData.entity_classes.find(ec => ec.name === annotation.entity)?.color || '#ffeb3b'
        }));
        setDocumentAnnotations(prev => {
          const newMap = new Map(prev);
          newMap.set(doc.id, updatedEntities);
          return newMap;
        });
      }

      setProjectData(projectData);
      setDocData(doc);
      setEntities(updatedEntities);
      setProjectDocuments(projectDocs);
      setIsComplete(doc.status === 'completed');
      
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate]);

  useEffect(() => {
    if (documentId) {
      fetchData();
    }
  }, [fetchData, documentId]);

  useEffect(() => {
    if (documentId) {
      setDocumentAnnotations(prev => {
        const newMap = new Map(prev);
        newMap.set(documentId, entities);
        return newMap;
      });

      const originalEntities = docData?.annotations?.map(annotation => ({
        start: annotation.start_index,
        end: annotation.end_index,
        label: annotation.entity,
        text: annotation.text
      })) || [];

      const hasChanged = JSON.stringify(originalEntities) !== JSON.stringify(entities.map(e => ({
        start: e.start,
        end: e.end,
        label: e.label,
        text: e.text
      })));
      
      setUnsavedDocuments(prev => {
        const newSet = new Set(prev);
        if (hasChanged) {
          newSet.add(documentId);
        } else {
          newSet.delete(documentId);
        }
        return newSet;
      });
    }
  }, [documentId, entities, docData]);

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

  const handleRemoveEntity = useCallback((index) => {
    const newEntities = [...entities];
    newEntities.splice(index, 1);
    setEntities(newEntities);
  }, [entities]);

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
    const selectedText = selection.toString().trim();
    
    if (!selectedText) return;
    
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(textContentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    const currentDocData = documentDataMap.get(documentId);
    if (!currentDocData || currentDocData.text.slice(start, end) !== selectedText) {
      console.error('Selected text does not match document text');
      toast.error('Invalid text selection');
      return;
    }

    const hasOverlap = entities.some(entity => {
      const overlaps = (
        (start >= entity.start && start < entity.end) || 
        (end > entity.start && end <= entity.end) || 
        (start <= entity.start && end >= entity.end)
      );
      
      const isDuplicate = start === entity.start && end === entity.end;
      
      return overlaps || isDuplicate;
    });

    if (hasOverlap) {
      toast.error('Overlapping or duplicate annotation detected');
      return;
    }

    const newEntity = {
      start,
      end,
      label: selectedEntity.name,
      text: selectedText,
      color: selectedEntity.color
    };

    console.log('New entity:', newEntity);
    setEntities(prev => {
      const updated = [...prev, newEntity].sort((a, b) => a.start - b.start);
      return updated;
    });
  }, [selectedEntity, entities, documentId, documentDataMap]);

  const handleEntitiesChange = useCallback((newEntities) => {
    setEntities(newEntities);
  }, []);

  const handleAddEntity = useCallback((newEntity) => {
    const formattedEntity = {
      start: newEntity.start,
      end: newEntity.end,
      label: newEntity.label,
      text: newEntity.text
    };

    setEntities(prev => [...prev, newEntity]);
  }, []);

  const navigateDocument = useCallback((direction) => {
    const currentIndex = projectDocuments.findIndex(doc => doc.id === documentId);
    const nextIndex = currentIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < projectDocuments.length) {
      setDocumentAnnotations(prev => {
        const newMap = new Map(prev);
        newMap.set(documentId, entities);
        return newMap;
      });

      const nextDoc = projectDocuments[nextIndex];
      navigate(`/annotate/${nextDoc.id}`);
    }
  }, [documentId, entities, projectDocuments, navigate]);

  const handleSaveAll = async () => {
    if (unsavedDocuments.size === 0) return;

    try {
      setLoading(true);
      const promises = Array.from(unsavedDocuments).map(async (docId) => {
        const annotationEntities = documentAnnotations.get(docId);
        const docData = documentDataMap.get(docId);
        
        if (!annotationEntities || !docData) {
          console.error('Missing data for document:', docId);
          return;
        }

        const validAnnotations = annotationEntities
          .filter(entity => {
            const isValid = 
              entity.start >= 0 && 
              entity.end <= docData.text.length &&
              entity.start < entity.end &&
              docData.text.slice(entity.start, entity.end) === entity.text;
            
            if (!isValid) {
              console.warn('Invalid annotation:', entity, 'for document:', docId);
            }
            return isValid;
          })
          .sort((a, b) => a.start - b.end);

        const annotations = validAnnotations.map(entity => ({
          start_index: entity.start,
          end_index: entity.end,
          entity: entity.label,
          text: entity.text
        }));

        console.log('Saving document:', docId, 'with annotations:', annotations);

        await updateDocument(docId, {
          annotations,
          text: docData.text,
          project_id: docData.project_id,
          status: docData.status
        });
      });

      await Promise.all(promises);
      setUnsavedDocuments(new Set());
      toast.success('All changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!unsavedDocuments.has(documentId)) return;

    try {
      setLoading(true);
      const annotationEntities = documentAnnotations.get(documentId);
      const docData = documentDataMap.get(documentId);
      
      if (!annotationEntities || !docData) {
        console.error('Missing data for current document');
        return;
      }

      const validAnnotations = annotationEntities
        .filter(entity => {
          const isValid = 
            entity.start >= 0 && 
            entity.end <= docData.text.length &&
            entity.start < entity.end &&
            docData.text.slice(entity.start, entity.end) === entity.text;
          
          if (!isValid) {
            console.warn('Invalid annotation:', entity);
          }
          return isValid;
        })
        .sort((a, b) => a.start - b.end);

      const annotations = validAnnotations.map(entity => ({
        start_index: entity.start,
        end_index: entity.end,
        entity: entity.label,
        text: entity.text
      }));

      console.log('Saving current document with annotations:', annotations);

      await updateDocument(documentId, {
        annotations,
        text: docData.text,
        project_id: docData.project_id,
        status: docData.status
      });

      setUnsavedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });

      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsComplete(!isComplete);
    try {
      await updateDocument(documentId, {
        ...docData,
        status: !isComplete ? 'completed' : 'in_progress'
      });
      toast.success(!isComplete ? 'Document marked as complete' : 'Document marked as in progress');
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
      setIsComplete(!isComplete); 
    }
  };

  const hasUnsavedChanges = unsavedDocuments.has(documentId);

  const handleBack = () => {
    if (unsavedDocuments.size > 0) {
      setShowExitDialog(true);
      setPendingNavigation(() => () => navigate(`/projects/${docData.project_id}`));
    } else {
      navigate(`/projects/${docData.project_id}`);
    }
  };

  const useBlockNavigation = (shouldBlock) => {
    const navigate = useNavigate();
    
    useEffect(() => {
      if (!shouldBlock) return;

      const unloadCallback = (event) => {
        event.preventDefault();
        event.returnValue = "";
        return "";
      };

      window.addEventListener("beforeunload", unloadCallback);
      return () => window.removeEventListener("beforeunload", unloadCallback);
    }, [shouldBlock]);
  };

  useBlockNavigation(unsavedDocuments.size > 0);

  const handleNavigationAttempt = (path) => {
    if (unsavedDocuments.size > 0) {
      setShowExitDialog(true);
      setPendingNavigation(() => () => navigate(path));
      return false;
    }
    return true;
  };

  useEffect(() => {
    return () => {
      // Cleanup any pending navigation when component unmounts
      setPendingNavigation(null);
      setShowExitDialog(false);
    };
  }, []);

  const handleExitConfirm = async (shouldSave) => {
    try {
      if (shouldSave) {
        await handleSaveAll();
      }
      
      if (pendingNavigation) {
        pendingNavigation();
      }
    } catch (error) {
      console.error('Error during exit:', error);
      toast.error('Failed to save changes before exit');
    } finally {
      setShowExitDialog(false);
      setPendingNavigation(null);
    }
  };

  const handleExitCancel = () => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  };

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
            padding: '0 1px',
            margin: '0',
            borderRadius: '2px',
            cursor: 'pointer',
            position: 'relative',
            display: 'inline',
            lineHeight: '1.5',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone'
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
              handleRemoveEntity(index);
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
  }, [docData?.text, entities, handleEntityClick, handleRemoveEntity]);

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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Paper sx={{ p: 3, mb: 3, position: 'relative' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1
          }}>
            <HomeButton />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back to Project
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={autoSave}
                    onChange={(e) => setAutoSave(e.target.checked)}
                  />
                }
                label="AutoSave"
              />
              <Button
                variant="contained"
                color={isComplete ? "success" : "primary"}
                onClick={handleMarkComplete}
                startIcon={isComplete ? <CheckIcon /> : null}
              >
                {isComplete ? "Marked Complete" : "Mark as Complete"}
              </Button>
              {!autoSave && unsavedDocuments.size > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAll}
                >
                  Save All ({unsavedDocuments.size})
                </Button>
              )}
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <img 
              src={require('../../assets/ai.jpg')}
              alt="AI" 
              style={{ 
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }} 
            />
          </Box>

          <Box
            ref={textContentRef}
            sx={{
              p: 2,
              border: '1px solid #ccc',
              borderRadius: 1,
              minHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              cursor: 'text',
              lineHeight: 1.6,
              fontSize: '1rem',
              '& mark': {
                textDecoration: 'none',
                display: 'inline',
                padding: '0 1px',
                margin: 0,
                borderRadius: '2px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone'
              },
            }}
            onMouseUp={handleTextSelection}
          >
            {renderedText}
          </Box>
        </Paper>

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

        <Dialog
          open={showExitDialog}
          onClose={() => {
            setShowExitDialog(false);
            setPendingNavigation(null);
          }}
        >
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You have unsaved changes. Would you like to save them before leaving?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowExitDialog(false);
                setPendingNavigation(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleExitConfirm(false)}
            >
              Don't Save
            </Button>
            <Button
              variant="contained"
              onClick={() => handleExitConfirm(true)}
            >
              Save & Exit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AnnotationTool;
