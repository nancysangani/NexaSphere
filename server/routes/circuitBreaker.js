import express from 'express';
import { circuitBreakerRegistry } from '../utils/circuitBreaker.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();
const adminAuth = adminAuthMiddleware.requireAdmin;

router.get('/metrics', adminAuth, async (req, res) => {
  const metrics = circuitBreakerRegistry.getAllMetrics();
  return res.json({ circuitBreakers: metrics });
});

router.post('/reset/:name', adminAuth, async (req, res) => {
  const { name } = req.params;
  const ok = circuitBreakerRegistry.reset(name);
  if (!ok) {
    return res.status(404).json({ error: `No circuit breaker found: "${name}"` });
  }
  return res.json({ ok: true, message: `Circuit breaker "${name}" reset to CLOSED` });
});

router.post('/retry/:name', adminAuth, async (req, res) => {
  const { name } = req.params;
  try {
    const breaker = circuitBreakerRegistry.get(name);
    if (!breaker) {
      return res.status(404).json({ error: `No circuit breaker found: "${name}"` });
    }
    const result = await breaker.manualRetry();
    return res.json({ ok: true, state: breaker.state, result });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

export default router;
