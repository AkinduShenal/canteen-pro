import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import app from './app.js';
import connectDB from './config/db.js';

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startListening = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is in use, retrying on ${nextPort}...`);
      startListening(nextPort);
      return;
    }

    throw error;
  });
};

const startServer = async () => {
  await connectDB();
  startListening(DEFAULT_PORT);
};

startServer();
