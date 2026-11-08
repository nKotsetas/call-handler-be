import { Router } from 'express';

const router = Router();

const callNotFound = (res) => res.status(404).json({ error: 'Call not found' });

router.get('/', (req, res) => {
  res.json({ calls: res.locals.callService.getAllCalls() });
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

export default router;
