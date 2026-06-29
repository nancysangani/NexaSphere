import React from 'react';
import { Tag, Code } from 'lucide-react';
import '../../styles/resume.css';

export default function RecommendationCard({ project, match }) {
  if (!project) return null;

  return (
    <div className="recommendation-card">
      <div className="recommendation-card-header">
        <span className="project-category">{project.category}</span>
        <h3 className="project-card-title">{project.title}</h3>
      </div>
      <div className="recommendation-card-body">
        <p className="project-card-desc">{project.shortDesc}</p>

        {/* Match Chips */}
        <div className="match-chips">
          {match.matchChips.map((chip) => (
            <span key={chip} className="match-chip">
              ✨ {chip}
            </span>
          ))}
        </div>

        {/* Why it matches */}
        <div className="why-matches-box">
          <p className="why-matches-title">Why it matches:</p>
          <p className="why-matches-text">{match.whyItMatches}</p>
        </div>

        {/* Tech Stack */}
        <div className="project-tech-stack" style={{ marginTop: '16px' }}>
          {project.techStack.map((tech) => (
            <span key={tech} className="tech-pill">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
