import { useState, useRef, useEffect } from 'react';
import { Rocket, Github, Linkedin, Instagram, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { teamMembers } from '../../data/teamData';
import apiClient from '../../utils/apiClient.js';
import {
  getLocalTeamMembers,
  mergeTeamMembers,
  subscribePublicContent,
} from '../../utils/publicContentStore.js';
import { IconSpark } from '../../shared/Icons';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';

function MemberCard({ member, idx }) {
  const ref = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const agDelays = [-0.0, -2.1, -4.2, -1.0, -3.3, -5.5, -0.7, -6.1, -2.8, -4.9, -1.6, -3.8];

  const onMove = (e) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    c.style.transform = `translateY(-10px) rotateX(${-y * 15}deg) rotateY(${x * 15}deg) scale(1.02)`;
    c.style.boxShadow = `0 20px 40px rgba(123,111,255,0.2)`;
  };

  const onLeave = () => {
    const c = ref.current;
    if (!c) return;
    c.style.transform = '';
    c.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
  };

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--r3)',
        padding: '24px',
        position: 'relative',
        perspective: '1000px',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        animation: `fadeInUp 0.6s ease-out forwards`,
        animationDelay: `${(idx % 12) * 0.1}s`,
        opacity: 0,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #7b6fff, #00d4ff)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <img
          src={
            imgError
              ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=7b6fff&textColor=ffffff`
              : member.photo
          }
          alt={member.name}
          onError={() => setImgError(true)}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(123,111,255,0.4)',
            boxShadow: '0 0 20px rgba(123,111,255,0.3)',
          }}
        />
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--t1)' }}>
            {member.name}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#7b6fff', fontWeight: 600 }}>
            {member.role}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {member.branch && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px',
              color: 'var(--t2)',
            }}
          >
            {member.branch}
          </span>
        )}
        {member.year && (
          <span
            style={{
              fontSize: '0.7rem',
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px',
              color: 'var(--t2)',
            }}
          >
            {member.year}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: 'auto',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '16px',
        }}
      >
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--t2)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0077b5')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t2)')}
          >
            <Linkedin size={18} />
          </a>
        )}
        {member.instagram && (
          <a
            href={member.instagram}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--t2)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e1306c')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t2)')}
          >
            <Instagram size={18} />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            style={{ color: 'var(--t2)', transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ea4335')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t2)')}
          >
            <Mail size={18} />
          </a>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--c1)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {expanded ? 'Less' : 'More'}{' '}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: '16px',
            fontSize: '0.85rem',
            color: 'var(--t2)',
            lineHeight: 1.6,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <p>
            Passionate contributor to NexaSphere. Active in building our community and developing
            technical solutions.
          </p>
          {member.achievements && member.achievements.length > 0 && (
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              {member.achievements.map((ach, i) => (
                <li key={i} style={{ color: '#00d4ff' }}>
                  {ach}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function GithubContributors() {
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    // Attempt to fetch from GitHub API for GSSoC repo or fallback
    fetch('https://api.github.com/repos/anshika1179/NexaSphere/contributors?per_page=14')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setContributors(data);
      })
      .catch((err) => console.error('Failed to fetch contributors', err));
  }, []);

  if (!contributors || contributors.length === 0) return null;

  return (
    <div style={{ marginTop: '80px', textAlign: 'center' }}>
      <h3 style={{ fontSize: '1.8rem', color: 'var(--t1)', marginBottom: '10px' }}>
        <Github
          size={24}
          style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}
        />
        Open Source Contributors
      </h3>
      <p style={{ color: 'var(--t2)', marginBottom: '30px' }}>
        Thanks to everyone who has contributed to the NexaSphere codebase!
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        {contributors.map((c) => (
          <a
            key={c.id}
            href={c.html_url}
            target="_blank"
            rel="noreferrer"
            title={c.login}
            style={{
              display: 'block',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.1)',
              transition: 'transform 0.2s, borderColor 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.borderColor = '#7b6fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <img
              src={c.avatar_url}
              alt={c.login}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export default function TeamPage({ onBack, onApply }) {
  const [members, setMembers] = useState(() => getLocalTeamMembers(teamMembers));
  const [activeTab, setActiveTab] = useState('All');

  const tabs = [
    'All',
    'Organizers',
    'Core Developers',
    'Design & Creative',
    'Editorial & Content',
    'Mentors',
  ];

  useEffect(() => {
    window.scrollTo({ top: 0 });
    let alive = true;
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');

    if (!base) {
      subscribePublicContent(() => {
        if (alive) setMembers(getLocalTeamMembers(teamMembers));
      });
      return () => {
        alive = false;
      };
    }

    const fetchTeam = () => {
      apiClient(`${base}/api/content/team`)
        .then((data) => {
          if (!alive) return;
          setMembers(
            Array.isArray(data?.members) && data.members.length
              ? mergeTeamMembers(teamMembers, data.members)
              : getLocalTeamMembers(teamMembers)
          );
        })
        .catch(() => {});
    };

    fetchTeam();
    const interval = setInterval(fetchTeam, 4000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const filteredMembers = members.filter((m) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Organizers')
      return m.role.toLowerCase().includes('organis') || m.role.toLowerCase().includes('organiz');
    if (activeTab === 'Core Developers') return m.role.toLowerCase().includes('core');
    // Mock mapping for others since data might not have it
    if (activeTab === 'Design & Creative') return m.role.toLowerCase().includes('design');
    if (activeTab === 'Editorial & Content')
      return m.role.toLowerCase().includes('content') || m.role.toLowerCase().includes('editor');
    if (activeTab === 'Mentors') return m.role.toLowerCase().includes('mentor');
    return false;
  });

  return (
    <div id="team-page" style={{ minHeight: '100vh', padding: '0 0 100px' }}>
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(123,111,255,.07), rgba(189,92,255,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '70px 0 50px',
          textAlign: 'center',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="page-banner-line"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg,var(--c2),var(--c3),var(--c1))',
          }}
        />
        <BannerOrbs color="rgba(123,111,255,.07)" />
        <button
          onClick={onBack}
          className="ns-back-btn"
          style={{
            position: 'absolute',
            top: '24px',
            left: '28px',
            background: 'var(--card)',
            border: '1px solid var(--bdr)',
            borderRadius: '50px',
            padding: '7px 16px',
            color: 'var(--t2)',
            fontSize: '.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600,
            zIndex: 10,
          }}
        >
          ← Back
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span
            style={{
              display: 'block',
              textAlign: 'center',
              marginBottom: '8px',
              fontFamily: "'Space Mono', monospace",
              fontSize: '.6rem',
              color: 'var(--t3)',
              letterSpacing: '.3em',
              textTransform: 'uppercase',
              animation: 'fadeIn 0.5s ease',
            }}
          >
            GL Bajaj Group of Institutions · Mathura
          </span>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', animation: 'fadeInUp 0.6s ease' }}
          >
            Core Team
          </h1>
          <p
            className="section-subtitle"
            style={{ maxWidth: '500px', margin: '0 auto', animation: 'fadeInUp 0.7s ease' }}
          >
            The minds and hands behind NexaSphere — meet the people driving the vision forward.
          </p>
        </div>

        {/* Role Tabs Filter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '32px',
            position: 'relative',
            zIndex: 2,
            animation: 'fadeInUp .8s ease',
            flexWrap: 'wrap',
            padding: '0 20px',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 24px',
                background:
                  activeTab === tab
                    ? 'linear-gradient(135deg, #7b6fff, #bd5cff)'
                    : 'rgba(255,255,255,0.02)',
                color: activeTab === tab ? '#fff' : 'var(--t2)',
                border: `1px solid ${activeTab === tab ? 'transparent' : 'var(--bdr)'}`,
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab ? '0 4px 15px rgba(123,111,255,0.4)' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredMembers.map((m, i) => (
            <MemberCard key={m.id} member={m} idx={i} />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            No team members found for this role.
          </div>
        )}

        <GithubContributors />

        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r3)',
            maxWidth: '600px',
            margin: '80px auto 0',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #7b6fff, #00d4ff, #bd5cff)',
            }}
          />
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#7b6fff' }}>
            <Rocket size={40} style={{ display: 'inline' }} />
          </div>
          <h3
            style={{
              fontFamily: 'Orbitron,monospace',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--t1)',
              marginBottom: '12px',
            }}
          >
            Want to Join NexaSphere?
          </h3>
          <p
            style={{
              color: 'var(--t2)',
              fontSize: '.9rem',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}
          >
            We're looking for passionate students to drive NexaSphere forward. Join our team and
            help build the future!
          </p>
          <button
            type="button"
            onClick={() => onApply && onApply()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #7b6fff, #00d4ff)',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(123,111,255,0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Apply Here <IconSpark />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <Footer />
    </div>
  );
}
