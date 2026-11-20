import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DemoModal from './components/DemoModal';
import HomePage from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DashboardPage from './pages/DashboardPage';
import ReviewsPage from './pages/ReviewsPage';
import AboutPage from './pages/AboutPage';
import HistoryPage from './pages/HistoryPage';
import SuspiciousPositivesPage from './pages/SuspiciousPositivesPage';
import ContradictionsPage from './pages/ContradictionsPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import { reviewApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModel, setSelectedModel] = useState('Logistic Regression');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-load boAt Rockerz sample on initial mount for instant presentation
  useEffect(() => {
    if (!currentAnalysis) {
      reviewApi.getSampleProducts()
        .then((res) => {
          const sample = res.samples?.[0];
          if (sample) {
            reviewApi.analyzeProductUrl({
              product_url: sample.url,
              model_name: selectedModel
            }).then(data => {
              setCurrentAnalysis(data);
            }).catch(e => console.warn("Initial sample load skipped:", e));
          }
        })
        .catch(err => console.warn("Samples fetch skipped:", err));
    }
  }, []);

  const handleAnalysisComplete = (analysisData) => {
    setCurrentAnalysis(analysisData);
    setActiveTab('dashboard');
  };

  const handleRunDemoCase = async (caseId) => {
    setIsLoading(true);
    try {
      const result = await reviewApi.runDemoCase(caseId, selectedModel);
      setCurrentAnalysis(result);
      setIsDemoModalOpen(false);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Demo run failed:", err);
      alert("Failed to run demo case: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Navbar
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        currentAnalysis={currentAnalysis}
        activeTab={activeTab}
        onNavigate={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasAnalysis={!!currentAnalysis}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* Page 1: Home Page (Product URL Input) */}
          {activeTab === 'home' && (
            <HomePage
              onStartAnalysis={handleAnalysisComplete}
              onNavigate={setActiveTab}
              onOpenDemo={() => setIsDemoModalOpen(true)}
            />
          )}

          {/* Page 2: Analysis Page (Product Information & Progress) */}
          {activeTab === 'analysis' && (
            <AnalysisPage
              analysis={currentAnalysis}
              onAnalysisComplete={handleAnalysisComplete}
              onNavigate={setActiveTab}
            />
          )}

          {/* Page 3: Dashboard (Overall Review Analysis & Trust Score) */}
          {activeTab === 'dashboard' && (
            <DashboardPage
              analysis={currentAnalysis}
              onNavigate={setActiveTab}
            />
          )}

          {/* Page 4: Detailed Reviews (Individual Review Classifications) */}
          {activeTab === 'reviews' && (
            <ReviewsPage
              analysis={currentAnalysis}
            />
          )}

          {/* Page 5: About Page (Project Information & Working Methodology) */}
          {activeTab === 'about' && (
            <AboutPage />
          )}

          {/* Analysis History Page (Saved Reports from SQLite) */}
          {activeTab === 'history' && (
            <HistoryPage
              onSelectAnalysis={setCurrentAnalysis}
              onNavigate={setActiveTab}
            />
          )}

          {/* Specialized Modules */}
          {activeTab === 'suspicious-positives' && (
            <SuspiciousPositivesPage
              analysis={currentAnalysis}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'contradictions' && (
            <ContradictionsPage
              analysis={currentAnalysis}
            />
          )}

          {activeTab === 'models' && (
            <ModelPerformancePage />
          )}
        </main>
      </div>

      {/* Demonstration Scenarios Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectCase={handleRunDemoCase}
        selectedModel={selectedModel}
        isLoading={isLoading}
      />
    </div>
  );
}
