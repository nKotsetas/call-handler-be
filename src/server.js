import { CORS_ORIGIN, PORT } from './config.js';
import { createApp } from './http/app.js';

const app = createApp({ corsOrigin: CORS_ORIGIN });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
