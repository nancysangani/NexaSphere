import React, { useState } from 'react';
import ResumeUpload from './ResumeUpload';
import RecommendationCard from './RecommendationCard';
import RecommendationSkeleton from './RecommendationSkeleton';
import { projectsData } from '../../data/projectsData';
import '../../styles/resume.css';

export default function ProjectRecommendations({ onBack }) {
  const [step, setStep] = useState('upload');
  const [recommendations, setRecommendations] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (file) => {
    setStep('analyzing');
    setError('');

    const apiBase = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    const recommendUrl = apiBase ? `${apiBase}/api/assistant/recommend` : null;

    if (recommendUrl && file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(recommendUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setIsDemo(false);
          setRecommendations(data);
          setStep('result');
          return;
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to process resume.');
        }
      } catch (err) {
        console.error('Error connecting to backend API:', err);
      }
    }

    // Backend unavailable, fallback to demo mode
    setTimeout(() => {
      setIsDemo(true);
      // Hardcoded fallback recommendations matching our mock projects list
      setRecommendations([
        {
          projectId: 'nexa-portal',
          matchChips: ['React', 'Node.js', 'Vite'],
          whyItMatches:
            'Your resume shows strong React and frontend experience which aligns perfectly with NexaSphere Portal requirements.',
        },
        {
          projectId: 'ui-kit',
          matchChips: ['UI Design', 'Figma', 'CSS Modules'],
          whyItMatches:
            'Your design sensitivity and storybook knowledge makes you an ideal candidate to build custom components for the Nexa UI Kit.',
        },
        {
          projectId: 'secure-share',
          matchChips: ['Mobile Dev', 'React Native'],
          whyItMatches:
            'Your experience with cross-platform apps maps well onto the mobile and cloud security requirements of SecureShare.',
        },
      ]);
      setStep('result');
    }, 2000);
  };

  return (
    <div className="recommendations-container">
      {onBack && (
        <button className="ra-back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
      )}

      <div className="ra-hero">
        <h1 className="ra-title">AI Project Recommendations</h1>
        <p className="ra-subtitle">
          Upload your resume to get matched with active community projects using Gemini AI.
        </p>
      </div>

      {step === 'upload' && (
        <div className="ra-upload-section">
          <ResumeUpload onUpload={handleUpload} />
          {error && (
            <p className="upload-error" style={{ textAlign: 'center', marginTop: '10px' }}>
              {error}
            </p>
          )}
        </div>
      )}

      {step === 'analyzing' && <RecommendationSkeleton />}

      {step === 'result' && (
        <div className="ra-results animate-fade-in">
          {isDemo && (
            <div className="ra-demo-banner" style={{ marginBottom: '20px' }}>
              ⚠️ Demo mode — resume recommendations API is not configured or backend is running
              offline. Showing sample recommendations.
            </div>
          )}

          <div className="recommendations-header-row">
            <h2>Your Best Matches</h2>
            <button className="re-upload-btn" onClick={() => setStep('upload')}>
              Re-upload Resume
            </button>
          </div>

          <div className="recommendations-grid">
            {recommendations.map((match, idx) => {
              const matchedProject = projectsData.find((p) => p.id === match.projectId);
              return (
                <RecommendationCard key={match.projectId} project={matchedProject} match={match} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
