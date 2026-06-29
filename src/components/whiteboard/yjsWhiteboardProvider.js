import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const DEFAULT_ENDPOINT = 'ws://localhost:1234';

function getEndpoint() {
  // Prefer URL param so deployments can override without rebuild.
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      return (
        url.searchParams.get('whiteboardWs') || url.searchParams.get('whiteboardWsEndpoint') || null
      );
    } catch {
      // ignore
    }
  }

  // Vite style env.
  try {
    const maybe = import.meta?.env?.VITE_WHITEBOARD_WS_ENDPOINT;
    if (maybe) return maybe;
  } catch {
    // ignore
  }

  // Fallback.
  if (typeof window !== 'undefined') {
    return window.__WHITEBOARD_WS_ENDPOINT__ || DEFAULT_ENDPOINT;
  }

  return DEFAULT_ENDPOINT;
}

export function createYjsDoc() {
  const doc = new Y.Doc();
  // Touch maps/arrays early so they exist.
  doc.getArray('elements');
  doc.getMap('state');
  doc.getMap('meta');
  return doc;
}

export function createYjsProvider({ roomName, doc, user, onAwarenessChange }) {
  const endpoint = getEndpoint();
  const provider = new WebsocketProvider(endpoint, roomName, doc, {
    connect: true,
  });

  const awareness = provider.awareness;

  const palette = ['#00d4ff', '#a855f7', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#22c55e'];

  const color = user?.color || palette[doc.clientID % palette.length];

  awareness.setLocalStateField('user', {
    id: user?.id || String(doc.clientID),
    name: user?.name || 'Anonymous',
    initials: user?.initials || 'U',
    color,
  });

  awareness.setLocalStateField('cursor', { x: 0, y: 0, visible: false });

  const emitAwareness = () => {
    if (!onAwarenessChange) return;
    const states = Array.from(awareness.getStates().values());
    const awarenessUsers = states
      .map((s) => s?.user)
      .filter(Boolean)
      .map((u) => ({ id: u.id, name: u.name, initials: u.initials, color: u.color }));
    onAwarenessChange(awarenessUsers);
  };

  awareness.on('change', emitAwareness);
  emitAwareness();

  return {
    provider,
    awareness,
    destroy: () => {
      awareness.off('change', emitAwareness);
      provider.destroy();
    },
  };
}
