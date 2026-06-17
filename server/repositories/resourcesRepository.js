import { withDb } from './db.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESOURCES_FILE = path.join(__dirname, '..', 'data', 'resources.json');

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    category: row.category,
    tags: row.tags || [],
    difficultyLevel: row.difficulty_level,
    uploadedBy: row.uploaded_by,
    downloads: row.downloads ?? 0,
    votes: row.votes || [],
    rating: parseFloat(row.rating) || 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getFileStore() {
  try {
    const raw = await fs.readFile(RESOURCES_FILE, 'utf8');
    return JSON.parse(raw || '{"resources":[]}');
  } catch {
    return { resources: [] };
  }
}

async function saveFileStore(data) {
  await fs.writeFile(RESOURCES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export const resourcesRepository = {
  async list({ page = 1, limit = 20, category, difficulty, status, q } = {}) {
    const offset = (page - 1) * limit;

    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      let results = [...store.resources];
      if (category) results = results.filter((r) => r.category === category);
      if (difficulty) results = results.filter((r) => r.difficulty_level === difficulty);
      if (status) results = results.filter((r) => r.status === status);
      if (q) {
        const lower = q.toLowerCase();
        results = results.filter(
          (r) =>
            r.title.toLowerCase().includes(lower) ||
            (r.description || '').toLowerCase().includes(lower) ||
            (r.tags || []).some((t) => t.toLowerCase().includes(lower))
        );
      }
      const total = results.length;
      const rows = results.slice(offset, offset + limit);
      return { rows: rows.map(mapRow), total };
    }

    return withDb(async (client) => {
      const conditions = ['1=1'];
      const params = [];
      let paramIdx = 1;

      if (category) {
        conditions.push(`category = $${paramIdx++}`);
        params.push(category);
      }
      if (difficulty) {
        conditions.push(`difficulty_level = $${paramIdx++}`);
        params.push(difficulty);
      }
      if (status) {
        conditions.push(`status = $${paramIdx++}`);
        params.push(status);
      }
      if (q) {
        conditions.push(
          `(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR tags::text ILIKE $${paramIdx})`
        );
        params.push(`%${q}%`);
        paramIdx++;
      }

      const where = conditions.join(' AND ');
      const listSql = `select * from resources where ${where} order by created_at desc limit $${paramIdx} offset $${paramIdx + 1}`;
      const countSql = `select count(*)::int as total from resources where ${where}`;

      const { rows } = await client.query(listSql, [...params, limit, offset]);
      const countResult = await client.query(countSql, params);

      return { rows: rows.map(mapRow), total: countResult.rows[0]?.total ?? 0 };
    });
  },

  async getById(id) {
    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      const found = store.resources.find((r) => r.id === id || r.id === parseInt(id, 10));
      return found ? mapRow(found) : null;
    }

    return withDb(async (client) => {
      const { rows } = await client.query('select * from resources where id = $1', [id]);
      return rows.length ? mapRow(rows[0]) : null;
    });
  },

  async create(resource) {
    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      const newResource = {
        ...resource,
        id: Date.now().toString(),
        downloads: 0,
        votes: [],
        rating: 0,
        status: resource.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.resources.unshift(newResource);
      await saveFileStore(store);
      return mapRow(newResource);
    }

    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into resources (title, description, file_url, file_type, file_size, category, tags, difficulty_level, uploaded_by, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         returning *`,
        [
          resource.title,
          resource.description || '',
          resource.file_url,
          resource.file_type || null,
          resource.file_size || null,
          resource.category || 'other',
          JSON.stringify(resource.tags || []),
          resource.difficulty_level || null,
          resource.uploaded_by || null,
          resource.status || 'pending',
        ]
      );
      return mapRow(rows[0]);
    });
  },

  async update(id, patch) {
    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      const idx = store.resources.findIndex((r) => r.id === id || r.id === parseInt(id, 10));
      if (idx === -1) return null;
      const updated = {
        ...store.resources[idx],
        ...patch,
        id: store.resources[idx].id,
        updated_at: new Date().toISOString(),
      };
      store.resources[idx] = updated;
      await saveFileStore(store);
      return mapRow(updated);
    }

    return withDb(async (client) => {
      const sets = [];
      const params = [];
      let paramIdx = 1;

      const fields = {
        title: 'title',
        description: 'description',
        file_url: 'fileUrl',
        file_type: 'fileType',
        file_size: 'fileSize',
        category: 'category',
        difficulty_level: 'difficultyLevel',
        status: 'status',
        downloads: 'downloads',
      };

      for (const [col, key] of Object.entries(fields)) {
        if (patch[key] !== undefined) {
          sets.push(`${col} = $${paramIdx++}`);
          params.push(patch[key]);
        }
      }

      if (patch.tags !== undefined) {
        sets.push(`tags = $${paramIdx++}`);
        params.push(JSON.stringify(patch.tags));
      }

      if (patch.votes !== undefined) {
        sets.push(`votes = $${paramIdx++}`);
        params.push(JSON.stringify(patch.votes));
      }

      if (patch.rating !== undefined) {
        sets.push(`rating = $${paramIdx++}`);
        params.push(patch.rating);
      }

      sets.push(`updated_at = now()`);

      params.push(id);
      const updateSql = `update resources set ${sets.join(', ')} where id = $${paramIdx} returning *`;
      const { rows } = await client.query(updateSql, params);
      return rows.length ? mapRow(rows[0]) : null;
    });
  },

  async delete(id) {
    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      const idx = store.resources.findIndex((r) => r.id === id || r.id === parseInt(id, 10));
      if (idx === -1) return false;
      store.resources.splice(idx, 1);
      await saveFileStore(store);
      return true;
    }

    return withDb(async (client) => {
      const { rowCount } = await client.query('delete from resources where id = $1', [id]);
      return rowCount > 0;
    });
  },

  async incrementDownloads(id) {
    if (!process.env.DATABASE_URL) {
      const store = await getFileStore();
      const idx = store.resources.findIndex((r) => r.id === id || r.id === parseInt(id, 10));
      if (idx === -1) return null;
      store.resources[idx].downloads = (store.resources[idx].downloads || 0) + 1;
      store.resources[idx].updated_at = new Date().toISOString();
      await saveFileStore(store);
      return mapRow(store.resources[idx]);
    }

    return withDb(async (client) => {
      const incrementSql = `update resources set downloads = downloads + 1, updated_at = now() where id = $1 returning *`;
      const { rows } = await client.query(incrementSql, [id]);
      return rows.length ? mapRow(rows[0]) : null;
    });
  },
};
