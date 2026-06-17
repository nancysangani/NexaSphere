import { useState } from 'react';
import { categories, difficultyLevels } from '../../data/resourcesData';

export default function ResourceUploadModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other',
    tags: '',
    difficultyLevel: '',
    uploadedBy: '',
  });

  if (!open) return null;

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      ...form,
      tags,
      createdAt: new Date().toISOString(),
    });

    setForm({
      title: '',
      description: '',
      category: 'other',
      tags: '',
      difficultyLevel: '',
      uploadedBy: '',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--t1)' }}>Share a Resource</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--t3)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--t2)',
                marginBottom: '4px',
              }}
            >
              Resource Title *
            </label>
            <input
              required
              value={form.title}
              onChange={handleChange('title')}
              placeholder="e.g. Intro to DSA Notes"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--t1)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--t2)',
                marginBottom: '4px',
              }}
            >
              Description
            </label>
            <textarea
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Brief description of the resource..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--t1)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  color: 'var(--t2)',
                  marginBottom: '4px',
                }}
              >
                Category
              </label>
              <select
                value={form.category}
                onChange={handleChange('category')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--t1)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  color: 'var(--t2)',
                  marginBottom: '4px',
                }}
              >
                Difficulty
              </label>
              <select
                value={form.difficultyLevel}
                onChange={handleChange('difficultyLevel')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--t1)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="">Any</option>
                {difficultyLevels.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--t2)',
                marginBottom: '4px',
              }}
            >
              Tags (comma-separated)
            </label>
            <input
              value={form.tags}
              onChange={handleChange('tags')}
              placeholder="e.g. Python, DSA, Beginner"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--t1)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                color: 'var(--t2)',
                marginBottom: '4px',
              }}
            >
              Your Name
            </label>
            <input
              value={form.uploadedBy}
              onChange={handleChange('uploadedBy')}
              placeholder="Your name or alias"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--t1)',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#CC1111',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Submit Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
