import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Default entity types - can be customized
const ENTITY_TYPES = [
  { label: 'PERSON', color: '#ffcdd2' },
  { label: 'ORGANIZATION', color: '#c8e6c9' },
  { label: 'LOCATION', color: '#bbdefb' },
  { label: 'DATE', color: '#fff9c4' },
  { label: 'CUSTOM', color: '#e1bee7' }
];

function AnnotationTool() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents/${id}`);
      setDocument(response.data);
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const start = getTextOffset(range.startContainer, range.startOffset);
      const end = start + text.length;
      
      setSelectedText({
        text,
        start,
        end
      });
      setOpenDialog(true);
    }
  };

  const getTextOffset = (node, offset) => {
    const walker = document.createTreeWalker(
      document.getElementById('annotationText'),
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentOffset = 0;
    while (walker.nextNode()) {
      if (walker.currentNode === node) {
        return currentOffset + offset;
      }
      currentOffset += walker.currentNode.length;
    }
    return currentOffset;
  };

  const handleAddEntity = async () => {
    if (!selectedText || (!selectedType && !customLabel)) return;

    const newEntity = {
      start: selectedText.start,
      end: selectedText.end,
      label: selectedType === 'CUSTOM' ? customLabel : selectedType,
      text: selectedText.text
    };

    const updatedEntities = [...document.entities, newEntity].sort((a, b) => a.start - b.start);
    
    try {
      const response = await axios.put(`${API_URL}/documents/${id}`, {
        ...document,
        entities: updatedEntities
      });
      setDocument(response.data);
      setOpenDialog(false);
      setSelectedText('');
      setSelectedType('');
      setCustomLabel('');
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDeleteEntity = async (entityIndex) => {
    const updatedEntities = document.entities.filter((_, index) => index !== entityIndex);
    try {
      const response = await axios.put(`${API_URL}/documents/${id}`, {
        ...document,
        entities: updatedEntities
      });
      setDocument(response.data);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const renderAnnotatedText = () => {
    if (!document) return null;

    let lastIndex = 0;
    const elements = [];
    
    document.entities.forEach((entity, index) => {
      // Add text before entity
      if (entity.start > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {document.text.slice(lastIndex, entity.start)}
          </span>
        );
      }

      // Add highlighted entity
      const entityType = ENTITY_TYPES.find(type => 
        type.label === entity.label || (type.label === 'CUSTOM' && !ENTITY_TYPES.find(t => t.label === entity.label))
      );
      const backgroundColor = entityType ? entityType.color : '#e1bee7';

      elements.push(
        <Box
          component="span"
          key={`entity-${index}`}
          sx={{
            backgroundColor,
            padding: '2px 4px',
            margin: '0 2px',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          {document.text.slice(entity.start, entity.end)}
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            ({entity.label})
          </Typography>
        </Box>
      );

      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < document.text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {document.text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  if (!document) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Text for Annotation
        </Typography>
        <Box
          id="annotationText"
          onMouseUp={handleTextSelection}
          sx={{
            p: 2,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            whiteSpace: 'pre-wrap',
            cursor: 'text'
          }}
        >
          {renderAnnotatedText()}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Entities
        </Typography>
        <List>
          {document.entities.map((entity, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDeleteEntity(index)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={`${entity.text} (${entity.label})`}
                secondary={`Position: ${entity.start}-${entity.end}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Entity</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Selected text: {selectedText.text}
          </Typography>
          <Box sx={{ mt: 2 }}>
            {ENTITY_TYPES.map((type) => (
              <Chip
                key={type.label}
                label={type.label}
                onClick={() => setSelectedType(type.label)}
                sx={{
                  m: 0.5,
                  backgroundColor: selectedType === type.label ? type.color : undefined
                }}
              />
            ))}
          </Box>
          {selectedType === 'CUSTOM' && (
            <TextField
              fullWidth
              label="Custom Label"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEntity} variant="contained" color="primary">
            Add Entity
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AnnotationTool;
