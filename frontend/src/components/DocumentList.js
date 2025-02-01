import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newText, setNewText] = useState('');
  const [projectId, setProjectId] = useState(''); // Add this line
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents/`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleAddDocument = async () => {
    try {
      const response = await axios.post(`${API_URL}/documents/`, {
        text: newText,
        project_id: projectId,
        filename: `document_${Date.now()}.txt`,
        annotations: [],
        status: 'pending'
      });
      setDocuments([...documents, response.data]);
      setNewText('');
      setProjectId(''); // Add this line
      setOpenDialog(false);
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  const handleNavigateToAnnotation = (id) => {
    navigate(`/annotate/${id}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Add New Document
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Text Preview</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell sx={{ maxWidth: '60%' }}>{doc.text.substring(0, 150)}...</TableCell>
                <TableCell>{doc.status}</TableCell>
                <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => handleNavigateToAnnotation(doc.id)}
                  >
                    Annotate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project ID"
            fullWidth
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
          <TextField
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
          <Button onClick={handleAddDocument} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DocumentList;
