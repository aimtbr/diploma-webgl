import { readFile, unlink } from 'fs';
import { Request, Response } from 'express';

import { UPLOADS_DIR } from '../../server';


export default class FileManagement {
  static async uploadFile (req: Request, res: Response): Promise<void> {
    try {
      if (req.file === undefined) {
        res.status(404).send();
      }

      const fileName = req.file.filename;
      await FileManagement.rawToJSON(fileName);

      res.status(200).send();
      // if (!req.files) {
      //   res.send({
      //     status: false,
      //     message: 'No file uploaded'
      //   });
      // } else {
      //   //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
      //   let avatar = req.files;
        
      //   //Use the mv() method to place the file in upload directory (i.e. "uploads")
      //   avatar.mv('./uploads/' + avatar.name);

      //   //send response
      //   res.send({
      //     status: true,
      //     message: 'File is uploaded',
      //     data: {
      //       name: avatar.name,
      //       mimetype: avatar.mimetype,
      //       size: avatar.size
      //     }
      //   });
      // }
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async rawToJSON (fileName: string): Promise<void> {
    try {
      let rawData; 
      const pathToFile = `${UPLOADS_DIR}\\${fileName}`;

      await readFile(pathToFile, (err, data) => {
        if (err !== null) {
          console.error(`Error occurred while reading the '${pathToFile}' file`);
        }

        rawData = data;
      });

      console.log('DATA', rawData);

      unlink(pathToFile, (err) => {
        console.error(`Error occurred while removing the '${pathToFile}' file`);
      });
    } catch (error) {
      console.error(error);
    }
  }
}