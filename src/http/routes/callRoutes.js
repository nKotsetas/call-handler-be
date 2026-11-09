import { Router } from 'express';

const router = Router();

const callNotFound = (res) => res.status(404).json({ error: 'Call not found' });

function parseFilters(query) {
  const filters = {};

  if (query.call_type !== undefined) filters.call_type = query.call_type;
  if (query.direction !== undefined) filters.direction = query.direction;

  if (query.is_archived === 'true') filters.is_archived = true;
  else if (query.is_archived === 'false') filters.is_archived = false;
  else if (query.is_archived !== undefined) filters.is_archived = query.is_archived;

  return filters;
}

router.get('/', (req, res) => {
  const calls = res.locals.callService.getAllCalls(parseFilters(req.query));
  res.json({ calls });
});

router.post('/', (req, res) => {
  const call = res.locals.callService.createCall(req.body);
  res.status(201).json(call);
});

router.get('/:callId', (req, res) => {
  const call = res.locals.callService.getCallById(req.params.callId);
  if (!call) return callNotFound(res);

  res.json(call);
});

router.patch('/:callId/archive', (req, res) => {
  const call = res.locals.callService.archiveCall(req.params.callId);
  if (!call) return callNotFound(res);

  res.json(call);
});

router.patch('/:callId/unarchive', (req, res) => {
  const call = res.locals.callService.unarchiveCall(req.params.callId);
  if (!call) return callNotFound(res);

  res.json(call);
});

router.post('/:callId/notes', (req, res) => {
  const note = res.locals.callService.addNote(req.params.callId, req.body?.content);
  if (!note) return callNotFound(res);

  res.status(201).json(note);
});

router.delete('/:callId', (req, res) => {
  const deleted = res.locals.callService.deleteCall(req.params.callId);
  if (!deleted) return callNotFound(res);

  res.status(204).end();
});

export default router;
