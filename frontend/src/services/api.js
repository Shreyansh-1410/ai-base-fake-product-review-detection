import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export const reviewApi = {
  // Extract Product Information from Amazon or Flipkart URL
  extractProductDetails: async (productUrl) => {
    const response = await api.post('/products/extract', { product_url: productUrl });
    return response.data;
  },

  // Main URL-to-Analysis endpoint
  analyzeProductUrl: async (payload) => {
    const response = await api.post('/products/analyze-url', payload);
    return response.data;
  },

  // Get pre-verified sample products for 1-click test runs
  getSampleProducts: async () => {
    const response = await api.get('/products/samples');
    return response.data;
  },

  // Analyze manual or batch reviews
  analyzeReviews: async (batchData, modelName = 'Logistic Regression') => {
    const response = await api.post(`/reviews/analyze?model_name=${encodeURIComponent(modelName)}`, batchData);
    return response.data;
  },

  // Upload CSV or Excel file
  uploadFile: async (formData) => {
    const response = await api.post('/reviews/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Fetch analysis by ID from SQLite
  getAnalysis: async (analysisId) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  },

  // Fetch analysis history from SQLite
  getHistory: async () => {
    const response = await api.get('/analysis/history/list');
    return response.data;
  },

  // Delete analysis by ID from SQLite
  deleteAnalysis: async (analysisId) => {
    const response = await api.delete(`/analysis/${analysisId}`);
    return response.data;
  },

  // Clear all history in SQLite
  clearHistory: async () => {
    const response = await api.delete('/analysis/history/clear');
    return response.data;
  },

  // Get ML model benchmark metrics
  getModelMetrics: async () => {
    const response = await api.get('/models/metrics');
    return response.data;
  },

  // Get model status & loaded models
  getModelStatus: async () => {
    const response = await api.get('/models/status');
    return response.data;
  },

  // Get all 10 demo scenarios
  getDemoCases: async () => {
    const response = await api.get('/demo/cases');
    return response.data;
  },

  // Run a demo case
  runDemoCase: async (caseId, modelName = 'Logistic Regression') => {
    const response = await api.post(`/demo/run/${caseId}?model_name=${encodeURIComponent(modelName)}`);
    return response.data;
  },

  // Download PDF report
  downloadPdf: async (analysisId, filename = 'ReviewGuard_Report.pdf') => {
    const response = await api.get(`/reports/${analysisId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Export current in-memory analysis to PDF
  exportPdf: async (analysisData, filename = 'ReviewGuard_Report.pdf') => {
    const response = await api.post('/reports/export/pdf', analysisData, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Inspect Product Link
  inspectProductLink: async (payload) => {
    const response = await api.post('/products/inspect-link', payload);
    return response.data;
  },

  // Fetch demo preset product links
  getDemoLinks: async () => {
    const response = await api.get('/products/demo-links');
    return response.data;
  }
};
