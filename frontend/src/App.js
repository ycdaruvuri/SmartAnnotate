import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProjectList from './components/projects/ProjectList';
import CreateProject from './components/projects/CreateProject';
import ProjectView from './components/projects/ProjectView';
import AnnotationTool from './components/annotation/AnnotationTool';
import PrivateRoute from './components/PrivateRoute';

// Context
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Configure future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router {...router}>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <ProjectList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <PrivateRoute>
                    <CreateProject />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <PrivateRoute>
                    <ProjectView />
                  </PrivateRoute>
                }
              />
              <Route
                path="/annotate/:documentId"
                element={
                  <PrivateRoute>
                    <AnnotationTool />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/projects" />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={1500}
              hideProgressBar
              newestOnTop
              closeOnClick
              pauseOnFocusLoss={false}
              pauseOnHover={false}
              theme="light"
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
