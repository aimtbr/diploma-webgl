import { resolve } from 'path';
import express, { Request, Response } from 'express';

const PUBLIC_DIR = resolve(__dirname, 'public');
const { PORT=3000 } = process.env;
const server = express();

server.use(express.static(PUBLIC_DIR));

server.get('/', (req: Request, res: Response) => {
  res.sendFile(PUBLIC_DIR + '/index.html');
});

server.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
