import axios from 'axios';
import { auth } from './firebase';

// Setup base url with dotenv lookup
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

// Axios Request Interceptor to automatically attach Firebase JWT tokens
API.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.error("Failed to fetch idToken for request", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints mapping
export const uploadMaterial = (formData) => {
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getDocuments = () => API.get('/documents');
export const deleteDocument = (docId) => API.delete(`/documents/${docId}`);

export const generateSummary = (docId) => API.post('/generate-summary', { docId });
export const getSummaries = () => API.get('/summaries');

export const generateFlashcards = (docId) => API.post('/generate-flashcards', { docId });
export const getFlashcards = (docId) => API.get(`/flashcards/${docId}`);
export const updateFlashcards = (docId, cards) => API.post('/flashcards/update', { docId, cards });

export const generateQuiz = (docId, quizType, numQuestions) => {
  return API.post('/generate-quiz', { docId, quizType, numQuestions });
};

export const evaluateQuiz = (quizId, answers) => {
  return API.post('/evaluate-quiz', { quizId, answers });
};

export const generateSchedule = () => API.post('/generate-schedule');
export const getSchedule = () => API.get('/schedules');

export const getAnalytics = () => API.get('/analytics');

export default API;
