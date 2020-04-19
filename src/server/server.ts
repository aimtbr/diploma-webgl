import { resolve } from 'path';
import cors from 'cors';
import multer from 'multer';
import express, { Request, Response } from 'express';
import FileManagement from './routes/handlers/fileManagement';


export const UPLOADS_DIR = resolve(__dirname, '..', 'uploads');
const PUBLIC_DIR = resolve(__dirname, 'public');
const { PORT=3000 } = process.env;

const server = express();
const uploader = multer({ dest: UPLOADS_DIR });

server.use(cors()); // allows the cross-origin resourse sharing
server.use(express.static(PUBLIC_DIR));


server.post('/upload-model', uploader.single('model'), FileManagement.uploadFile);

server.get('/', (req: Request, res: Response) => {
  res.sendFile(PUBLIC_DIR + '/index.html');
});

server.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
