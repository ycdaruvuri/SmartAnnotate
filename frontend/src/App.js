import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import theme from './theme';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Projects from './components/projects/Projects';
import ProjectView from './components/projects/ProjectView';
import Home from './pages/Home';
import AnnotationTool from './components/annotation/AnnotationTool';
import Pipelines from './pages/Pipelines';
import UserSettings from './pages/UserSettings';
import Variables from './pages/Variables';
import Statistics from './pages/Statistics';
import Documentation from './pages/Documentation';
import About from './pages/About';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';

// Configure React Router future flags
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router {...routerOptions}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <PrivateRoute>
                  <Projects />
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
            <Route
              path="/pipelines"
              element={
                <PrivateRoute>
                  <Pipelines />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <UserSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/variables"
              element={
                <PrivateRoute>
                  <Variables />
                </PrivateRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <PrivateRoute>
                  <Statistics />
                </PrivateRoute>
              }
            />
            <Route
              path="/docs"
              element={
                <PrivateRoute>
                  <Documentation />
                </PrivateRoute>
              }
            />
            <Route
              path="/about"
              element={
                <PrivateRoute>
                  <About />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/home" />} />
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
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
