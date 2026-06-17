import { formatFileSize } from '../../data/resourcesData';

const categoryGradients = {
  study_material: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
  project_template: 'linear-gradient(135deg, #0f9d58, #1b5e20)',
  notes: 'linear-gradient(135deg, #e8710a, #bf360c)',
  past_papers: 'linear-gradient(135deg, #7b1fa2, #4a148c)',
  recorded_sessions: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
  other: 'linear-gradient(135deg, #546e7a, #263238)',
};

const categoryLabels = {
  study_material: 'Study Material',
  project_template: 'Template',
  notes: 'Notes',
  past_papers: 'Past Papers',
  recorded_sessions: 'Recording',
  other: 'Other',
};

function getFileEmoji(fileType) {
  if (!fileType) return '📄';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('text') || fileType.includes('markdown')) return '📝';
  if (fileType.includes('json') || fileType.includes('javascript') || fileType.includes('python'))
    return '💻';
  return '📄';
}

export default function ResourceCard({ resource, onVote, onDownload, votedByUser }) {
  const gradient = categoryGradients[resource.category] || categoryGradients.other;
  const label = categoryLabels[resource.category] || 'Resource';
  const fileEmoji = getFileEmoji(resource.fileType);

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          padding: '20px 20px 16px',
          background: gradient,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{fileEmoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              opacity: 0.85,
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={resource.title}
          >
            {resource.title}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {resource.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--t2)',
              lineHeight: 1.5,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {resource.description}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(resource.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--accent-alpha, rgba(204,17,17,0.08))',
                color: 'var(--t2)',
              }}
            >
              {tag}
            </span>
          ))}
          {(resource.tags || []).length > 3 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--t3)' }}>
              +{resource.tags.length - 3}
            </span>
          )}
        </div>

        {resource.difficultyLevel && (
          <div style={{ fontSize: '0.72rem', color: 'var(--t3)' }}>
            Difficulty:{' '}
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
              {resource.difficultyLevel}
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--t3)',
            marginTop: 'auto',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span title="Downloads">⬇ {resource.downloads}</span>
            <span title="Votes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onVote?.(resource.id);
                }}
                style={{
                  cursor: onVote ? 'pointer' : 'default',
                  opacity: votedByUser ? 1 : 0.6,
                  transition: 'opacity 0.2s',
                }}
                title={votedByUser ? 'Remove vote' : 'Upvote'}
              >
                {votedByUser ? '👍' : '👍'}
              </span>
              <span>{resource.votes?.length || 0}</span>
            </span>
          </div>
          <div>
            <span>{formatFileSize(resource.fileSize)}</span>
            <span style={{ marginLeft: '8px' }}>👤 {resource.uploadedBy}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(resource.id);
          }}
          style={{
            width: '100%',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--accent, #CC1111)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Download Resource
        </button>
      </div>
    </div>
  );
}
