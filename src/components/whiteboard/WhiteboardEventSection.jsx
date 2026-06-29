import React, { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import WhiteboardCollabCanvas from './WhiteboardCollabCanvas';
import { createYjsDoc, createYjsProvider } from './yjsWhiteboardProvider';
import { whiteboardTemplates } from './whiteboardTemplates';

const STORAGE_KEY_PREFIX = 'ns_whiteboard_event:';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function WhiteboardEventSection({ eventId, width = 1100, height = 680 }) {
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${eventId}`, [eventId]);

  const doc = useMemo(() => createYjsDoc(), [eventId]);

  const [provider, setProvider] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);

  // Minimal user identity for presence.
  const user = useMemo(() => {
    const initials = (Math.random().toString(36).slice(2, 4).toUpperCase() || 'U').slice(0, 2);
    return {
      id: String(doc.clientID),
      name: `User ${initials}`,
      initials,
      color: '#00d4ff',
    };
  }, [doc]);

  const roomName = `whiteboard:${eventId}`;

  useEffect(() => {
    const p = createYjsProvider({
      roomName,
      doc,
      user,
      onAwarenessChange: (users) => setPresenceUsers(users),
    });
    setProvider(p);
    return () => p.destroy();
  }, [doc, roomName, user]);

  // Optional: migrate old localStorage board into CRDT on first join.
  useEffect(() => {
    if (!provider) return;

    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) return;

    // Seed only if doc is empty.
    const yElements = doc.getArray('elements');
    if (yElements.length > 0) return;

    doc.transact(() => {
      yElements.push(parsed);
      doc.getMap('state').set('seeded', true);
    });
  }, [provider, storageKey, doc]);

  // Autosave every 30 seconds (for offline/local restore)

  useEffect(() => {
    if (!provider) return;
    const t = setInterval(() => {
      try {
        const yElements = doc.getArray('elements');
        localStorage.setItem(storageKey, JSON.stringify(yElements.toArray()));
      } catch {
        // ignore
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [provider, storageKey, doc]);

  const [templateKey, setTemplateKey] = useState('');
  const initialElements = useMemo(() => {
    if (!templateKey) return null;
    const tpl = whiteboardTemplates[templateKey];
    return tpl?.elements || null;
  }, [templateKey]);

  const exportPNG = () => {
    const canvas = document.querySelector('#ns-whiteboard-canvas');
    if (!canvas) {
      alert('Export failed: canvas not found');
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard-${eventId}.png`;
    a.click();
  };

  return (
    <div style={{ marginTop: 26 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: 18 }}>
            Event Whiteboard
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Live collaboration • Presence: {presenceUsers.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            <option value="">Templates</option>
            <option value="kanban">Kanban</option>
            <option value="mindmap">Mindmap</option>
            <option value="flowchart">Flowchart</option>
            <option value="swot">SWOT</option>
            <option value="leanCanvas">Lean Canvas</option>
          </select>

          <button
            onClick={exportPNG}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Export PNG
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <WhiteboardCollabCanvas
          width={width}
          height={height}
          doc={doc}
          providerAwareness={provider?.awareness}
          user={user}
          initialElements={initialElements}
        />
      </div>
    </div>
  );
}
