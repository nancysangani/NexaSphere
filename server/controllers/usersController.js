import { usersRepository } from '../repositories/usersRepository.js';
import { toPublicUserDTO, toAdminUserDTO } from '../utils/userSerializer.js';

const MAX_LIMIT = 100;
const ALLOWED_ROLES = ['admin', 'user', 'moderator', 'member'];

function parsePaginationAndFilters(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 20));
  const role = query.role && ALLOWED_ROLES.includes(query.role) ? query.role : undefined;
  return { page, limit, role };
}

export async function getPublicUsers(req, res) {
  try {
    const { page, limit, role } = parsePaginationAndFilters(req.query);

    const { getOrSet, hashKeyParts } = await import('../utils/endpointCache.js');
    const cacheKey = `cache:endpoint:users:public:${hashKeyParts(role || '', page, limit)}`;

    const { data, hit } = await getOrSet({
      key: cacheKey,
      ttlSeconds: 60 * 30,
      getValue: async () => {
        // Repository currently ignores page/limit/role, but we still scope the cache key
        // to prevent future behavior changes from serving incorrect payloads.
        const rawUsers = await usersRepository.getAllPublicUsers({ page, limit, role });
        const safeUsers = rawUsers.map(toPublicUserDTO);
        return { users: safeUsers, page, limit };
      },
    });

    res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
    return res.json(data);
  } catch (error) {
    console.error('[Security] Error in public users endpoint serialization:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const { page, limit, role } = parsePaginationAndFilters(req.query);
    const rawUsers = await usersRepository.getAllUsersAdmin({ page, limit, role });
    const safeUsers = rawUsers.map(toAdminUserDTO);
    return res.json({ users: safeUsers, page, limit });
  } catch (error) {
    console.error('[Security] Error in admin users endpoint serialization:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminCreateUser(req, res) {
  try {
    const { username, display_name, email, role } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'username and email are required' });
    }
    const user = await usersRepository.createUser({ username, display_name, email, role });
    return res.status(201).json({ user });
  } catch (error) {
    console.error('[Admin] Error creating user:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminUpdateUser(req, res) {
  try {
    const { id } = req.params;
    const { display_name, email, admin_roles } = req.body;
    const user = await usersRepository.updateUser(id, { display_name, email, admin_roles });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    console.error('[Admin] Error updating user:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function adminDeactivateUser(req, res) {
  try {
    const { id } = req.params;
    const user = await usersRepository.deactivateUser(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User deactivated', user });
  } catch (error) {
    console.error('[Admin] Error deactivating user:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
