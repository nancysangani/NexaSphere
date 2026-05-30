import { useState, useEffect, useRef } from 'react';
import { activities } from '../../data/activitiesData';
import { BannerOrbs } from '../../shared/MotionLayer';
import Footer from '../../shared/Footer';
import { DynamicIcon } from '../../shared/Icons';

const activityDetails = {
  Hackathon: {
    category: 'Coding Contests',
    color: '#CC1111',
    longDesc:
      'Intense 24–48 hour coding marathons where teams build innovative solutions to real-world problems under time pressure. Participants form cross-functional teams, brainstorm ideas, design architectures, and ship working prototypes — all under the clock.',
    highlights: [
      'Team-based challenges',
      'Mentorship from seniors',
      'Real problem statements',
      'Prizes & recognition',
    ],
    skills: ['Full-Stack Dev', 'Problem Solving', 'Team Collaboration', 'System Design'],
  },
  Codathon: {
    category: 'Coding Contests',
    color: '#EE2222',
    longDesc:
      'Competitive programming contests that test your algorithmic thinking, data structures knowledge, and code efficiency. From greedy to dynamic programming — sharpen your edge for placements and ICPC-style rounds.',
    highlights: [
      'Timed challenge rounds',
      'Multi-difficulty problems',
      'Leaderboard ranking',
      'Individual & team modes',
    ],
    skills: ['Algorithms', 'DSA', 'Competitive Programming', 'Optimization'],
  },
  Ideathon: {
    category: 'Tech Talks',
    color: '#FF4444',
    longDesc:
      'Creativity-first competition where the best idea wins — no code required. Pitch your innovation, back it with research, and present a compelling case. Perfect for thinkers, designers, and business-minded builders.',
    highlights: [
      'Pitching rounds',
      'Expert panel judging',
      'Market research focus',
      'Cross-discipline teams',
    ],
    skills: ['Creative Thinking', 'Presentation', 'Research', 'Product Design'],
  },
  Promptathon: {
    category: 'Coding Contests',
    color: '#FF6666',
    longDesc:
      'The art of talking to AI turned into a competitive sport. Craft the sharpest, most creative prompts to solve real-world problems, generate stunning outputs, and outsmart your peers in the age of generative intelligence.',
    highlights: [
      'Multi-round prompt battles',
      'Judged on creativity & accuracy',
      'Real-world AI tasks',
      'Leaderboard & prizes',
    ],
    skills: ['Prompt Engineering', 'AI Tools', 'Creative Thinking', 'Problem Solving'],
  },
  Workshop: {
    category: 'Workshops',
    color: '#AA0000',
    longDesc:
      'Hands-on learning sessions on cutting-edge tools, frameworks, and emerging technologies. Led by experienced peers, alumni, or industry guests — every workshop gets you building something real by the end.',
    highlights: [
      'Live coding sessions',
      'Take-home projects',
      'Q&A with experts',
      'Beginner to advanced tracks',
    ],
    skills: ['New Technologies', 'Practical Skills', 'Tool Mastery', 'Applied Learning'],
  },
  'Insight Session': {
    category: 'Knowledge Sharing Sessions',
    color: '#CC3333',
    longDesc:
      'Deep-dive talks and peer-to-peer knowledge sharing where every member is both teacher and student. Explore industry trends, career paths, emerging research, and the big ideas shaping tomorrow’s technology landscape.',
    highlights: [
      'Peer presentations',
      'Industry trend analysis',
      'Career guidance',
      'Open discussions',
    ],
    skills: ['Communication', 'Research', 'Critical Thinking', 'Domain Knowledge'],
  },
  'Open Source Day': {
    category: 'Workshops',
    color: '#4CAF50',
    longDesc:
      'Dedicated events encouraging real contributions to open-source projects. Learn Git workflows, find your first issue, submit PRs, and become part of the global developer community — all in a guided, supportive environment.',
    highlights: [
      'First-PR guidance',
      'Project selection help',
      'Git & GitHub deep dive',
      'Community recognition',
    ],
    skills: ['Git', 'Open Source', 'Code Review', 'Documentation'],
  },
  'Tech Debate': {
    category: 'Tech Talks',
    color: '#880000',
    longDesc:
      'Structured debates on the most controversial topics in tech — AI vs Human Jobs, Native vs Cross-Platform, SQL vs NoSQL. Sharpen your ability to defend a position, handle rebuttals, and communicate technical ideas clearly.',
    highlights: ['Structured format', 'Expert moderation', 'Both sides argued', 'Audience Q&A'],
    skills: ['Public Speaking', 'Critical Thinking', 'Technical Communication', 'Argumentation'],
  },
};

function SkeletonLoader() {
  return (
    <div
      className="ns-timeline-item"
      style={{ display: 'flex', gap: '30px', marginBottom: '40px', alignItems: 'flex-start' }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--card)',
          border: '2px solid var(--bdr)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--bdr)' }}
          className="skeleton-glow"
        />
      </div>
      <div
        style={{
          flex: 1,
          background: 'var(--card)',
          border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)',
          padding: '28px 24px',
          opacity: 0.7,
        }}
        className="skeleton-glow-card"
      >
        <div
          style={{
            width: '30%',
            height: '24px',
            background: 'var(--bdr)',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '14px',
            background: 'var(--bdr)',
            borderRadius: '4px',
            marginBottom: '10px',
          }}
        />
        <div
          style={{
            width: '85%',
            height: '14px',
            background: 'var(--bdr)',
            borderRadius: '4px',
            marginBottom: '10px',
          }}
        />
        <div
          style={{
            width: '90%',
            height: '14px',
            background: 'var(--bdr)',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              width: '80px',
              height: '20px',
              background: 'var(--bdr)',
              borderRadius: '20px',
            }}
          />
          <div
            style={{
              width: '100px',
              height: '20px',
              background: 'var(--bdr)',
              borderRadius: '20px',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes skelGlow {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .skeleton-glow {
          animation: skelGlow 1.5s infinite;
        }
        .skeleton-glow-card {
          animation: skelGlow 1.5s infinite;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}

function ActivityCardTimeline({ a, idx, onNavigate, align }) {
  const ref = useRef(null);
  const details = activityDetails[a.title] || {};
  const isLeft = align === 'left';

  const onMove = (e) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    c.style.transform = `translateY(-4px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.02)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  const click = () => {
    const c = ref.current;
    if (c) {
      c.style.transform = 'scale(.95)';
      setTimeout(() => {
        c.style.transform = '';
      }, 140);
    }
    setTimeout(() => onNavigate('activity', a.title), 160);
  };

  return (
    <div
      className={`ns-timeline-item ${align === 'mobile' ? 'mobile-align' : ''}`}
      style={{
        display: 'flex',
        flexDirection: align === 'right' ? 'row-reverse' : 'row',
        gap: '30px',
        marginBottom: '60px',
        alignItems: 'center',
        opacity: 0,
        animation: 'fadeInUp 0.6s ease forwards',
        animationDelay: `${idx * 0.15}s`,
      }}
    >
      <div
        className="ns-timeline-dot"
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'var(--card)',
          border: `2px solid ${a.color || 'var(--c1)'}`,
          flexShrink: 0,
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 15px ${a.color ? a.color + '40' : 'var(--c1-35)'}`,
        }}
      >
        <DynamicIcon name={a.icon} size={20} color={a.color || 'var(--c1)'} />
      </div>

      <div
        ref={ref}
        onClick={click}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="ns-act-card"
        style={{
          flex: 1,
          background: 'var(--card)',
          border: `1px solid var(--bdr)`,
          borderRadius: 'var(--r3)',
          padding: '32px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          perspective: '800px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: a.color || 'var(--c1)',
            borderRadius: 'var(--r3) var(--r3) 0 0',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '1.2rem',
                fontWeight: 700,
                color: a.color || 'var(--c1)',
                marginBottom: '6px',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
              }}
            >
              {a.title}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--t3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {details.category || 'Special Event'}
            </div>
          </div>
          <div style={{ opacity: 0.1, transform: 'scale(2) translate(10%, -10%)' }}>
            <DynamicIcon name={a.icon} size={48} color={a.color || 'var(--c1)'} />
          </div>
        </div>

        <p
          style={{
            fontSize: '.9rem',
            color: 'var(--t2)',
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          {details.longDesc || a.description}
        </p>

        {details.skills && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            {details.skills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: '.7rem',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: a.color ? `${a.color}18` : `var(--c1-18)`,
                  color: a.color || 'var(--c1)',
                  border: `1px solid ${a.color ? a.color + '35' : 'var(--c1-35)'}`,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 600,
                  transition: 'transform .2s',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '.8rem',
            fontWeight: 700,
            color: a.color || 'var(--c1)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            opacity: 0.8,
            marginTop: '10px',
          }}
        >
          <span>Explore Format</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage({ onNavigate, onBack }) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const categories = [
    'All',
    'Knowledge Sharing Sessions',
    'Workshops',
    'Coding Contests',
    'Tech Talks',
  ];

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const filteredActivities = activities.filter((a) => {
    if (filter === 'All') return true;
    const cat = activityDetails[a.title]?.category;
    return cat === filter;
  });

  const stats = [
    { label: 'Hours of Learning', value: '1,200+', icon: 'book' },
    { label: 'Sessions Conducted', value: '45+', icon: 'video' },
    { label: 'Guest Speakers', value: '12', icon: 'mic' },
    { label: 'Active Students', value: '850+', icon: 'users' },
  ];

  return (
    <div
      id="activities-page"
      style={{ minHeight: '100vh', padding: '60px 0 100px', position: 'relative' }}
    >
      <div
        className="page-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(204,17,17,.07), rgba(136,0,0,.04))',
          borderBottom: '1px solid var(--bdr)',
          padding: '60px 0 50px',
          textAlign: 'center',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',
          }}
        />
        <BannerOrbs color="rgba(204,17,17,.06)" />
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
          <span className="cin-section-label" style={{ animation: 'fadeIn .5s ease' }}>
            NexaSphere · Learning ecosystem
          </span>
          <h1
            className="section-title"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', animation: 'fadeInUp .6s ease' }}
          >
            Activities & Initiatives
          </h1>
          <p
            className="section-subtitle"
            style={{
              animation: 'fadeInUp .7s ease',
              maxWidth: '580px',
              margin: '0 auto',
            }}
          >
            Every format is designed to sharpen a different skill. Explore what excites you — then
            dive in.
          </p>
        </div>
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        {/* Analytics/Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '50px',
            animation: 'fadeInUp .8s ease',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--bdr)',
                borderRadius: 'var(--r3)',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                transition: 'transform 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
            >
              <div style={{ color: 'var(--c1)', marginBottom: '10px' }}>
                <DynamicIcon name={s.icon} size={28} />
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  fontFamily: "'Rajdhani', sans-serif",
                  color: 'var(--t1)',
                  marginBottom: '4px',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--t2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '60px',
          }}
        >
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                background: filter === c ? 'var(--c1)' : 'var(--card)',
                color: filter === c ? '#fff' : 'var(--t2)',
                border: `1px solid ${filter === c ? 'var(--c1)' : 'var(--bdr)'}`,
                padding: '10px 24px',
                borderRadius: '30px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filter === c ? '0 4px 15px rgba(204,17,17,0.3)' : 'none',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Timeline Container */}
        <div
          className="ns-timeline-container"
          style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '20px 0' }}
        >
          {/* Vertical Line */}
          <div
            className="ns-timeline-line"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: '2px',
              background:
                'linear-gradient(to bottom, transparent, var(--c1-35), var(--c1-35), transparent)',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
          />

          {loading ? (
            <>
              <SkeletonLoader />
              <SkeletonLoader />
              <SkeletonLoader />
            </>
          ) : (
            filteredActivities.map((a, i) => (
              <ActivityCardTimeline
                key={a.id}
                a={a}
                idx={i}
                onNavigate={onNavigate}
                align={window.innerWidth <= 768 ? 'mobile' : i % 2 === 0 ? 'left' : 'right'}
              />
            ))
          )}

          {!loading && filteredActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
              No activities found for this category.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ns-timeline-line {
            left: 23px !important;
          }
          .ns-timeline-item {
            flex-direction: row !important;
          }
        }
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
