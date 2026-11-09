import { ValidationError } from '../../validation/callValidator.js';

export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message, details: err.errors });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
