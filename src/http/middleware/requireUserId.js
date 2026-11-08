export function requireUserId(getServiceForUser) {
  return (req, res, next) => {
    const userId = req.get('X-User-Id')?.trim();

    if (!userId) {
      return res
        .status(400)
        .json({ error: 'Missing X-User-Id header. Please provide a unique identifier.' });
    }
    if (userId.length > 100) {
      return res.status(400).json({ error: 'X-User-Id header is too long' });
    }

    res.locals.callService = getServiceForUser(userId);
    next();
  };
}
