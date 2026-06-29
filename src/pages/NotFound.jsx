import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        background: '#0f172a',
        color: '#ffffff',
        padding: '20px',
      }}
    >
      {/* Big 404 */}
      <h1 style={{ fontSize: '6rem', margin: 0 }}>404</h1>

      {/* Message */}
      <h2 style={{ marginTop: '10px' }}>Page Not Found</h2>
      <p style={{ opacity: 0.7, maxWidth: '400px' }}>
        The page you’re looking for doesn’t exist or has been moved.
      </p>

      {/* Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: '#334155',
            color: 'white',
          }}
        >
          Go Back
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            background: '#3b82f6',
            color: 'white',
          }}
        >
          Home
        </button>
      </div>

      {/* Optional hint */}
      <p style={{ marginTop: '30px', fontSize: '12px', opacity: 0.5 }}>
        If you think this is a mistake, check the URL or contact support.
      </p>
    </div>
  );
}
