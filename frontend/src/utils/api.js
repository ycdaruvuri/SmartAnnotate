import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Add request interceptor to handle errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project APIs
export const createProject = async (projectData) => {
  try {
    const response = await axios.post(`${API_URL}/projects/`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const getProjects = async () => {
  try {
    const response = await axios.get(`${API_URL}/projects/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const getProject = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await axios.put(`${API_URL}/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Document APIs
export const createDocument = async (documentData) => {
  try {
    const response = await axios.post(`${API_URL}/documents/`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const uploadDocument = async (projectId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    
    const response = await axios.post(
      `${API_URL}/documents/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getProjectDocuments = async (projectId, skip = 0, limit = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/documents/project/${projectId}?skip=${skip}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching project documents:', error);
    throw error;
  }
};

export const getDocument = async (documentId) => {
  try {
    const response = await axios.get(`${API_URL}/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const updateDocument = async (documentId, documentData) => {
  try {
    const response = await axios.put(`${API_URL}/documents/${documentId}`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const exportProjectData = async (projectId) => {
  try {
    const response = await axios.get(`${API_URL}/documents/project/${projectId}/export`);
    return response.data;
  } catch (error) {
    console.error('Error exporting project data:', error);
    throw error;
  }
};
