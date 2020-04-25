import { promises as fs } from 'fs';
import { Request, Response } from 'express';


export default class FileManagement {
  static async uploadFile (req: Request, res: Response): Promise<void> {
    try {
      if (req.file === undefined) {
        res.status(404).send('The file hasn\'t been sent');
      }

      const { path } = req.file;

      const objectData = await FileManagement.rawToJSON(path);

      if (objectData !== null) {
        res.status(200).send(objectData);
      } else {
        res.status(500).send('Something went wrong while parsing the input file')
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async rawToJSON (path: string): Promise<object | null> {
    try {
      const fileContentBuffer = await fs.readFile(path);
      const fileContentString = fileContentBuffer.toString();
      const objectData = {
        numOfTrianglesPerElement: 0,
        numberOfVertices: 0,
        vertices: [] as number[],
        numberOfElements: 0,
        elementsIndices: [] as number[],
        numberOfOuterTriangles: 0,
        outerTrianglesIndices: [] as number[],
      };

      let numberOfElementsLine = 0;
      let numberOfOuterTrianglesLine = 0;
      let lineNumber = 0;
      let line: number[] = [];
      let setOfCharacters = '';
      let character;
      for (character of fileContentString) {
        if (character === '\n') {
          if (setOfCharacters !== '') {
            line.push(parseInt(setOfCharacters, 10));
            setOfCharacters = '';
          }

          lineNumber += 1;

          if (lineNumber === 1) {
            objectData.numOfTrianglesPerElement = line[0];
          } else if (lineNumber === 2) {
            objectData.numberOfVertices = line[0];
          } else if (lineNumber > 2 && lineNumber < 3 + objectData.numberOfVertices) {
            objectData.vertices = [ ...objectData.vertices, ...line ];
          } else if (lineNumber === 3 + objectData.numberOfVertices) {
            objectData.numberOfElements = line[0];
            numberOfElementsLine = 4 + objectData.numberOfVertices + line[0];
          } else if (lineNumber > 3 + objectData.numberOfVertices && lineNumber < numberOfElementsLine) {
            objectData.elementsIndices = [ ...objectData.elementsIndices, ...line ];
          } else if (lineNumber === numberOfElementsLine) {
            objectData.numberOfOuterTriangles = line[0];
            numberOfOuterTrianglesLine = 1 + numberOfElementsLine + line[0];
          } else if (lineNumber > numberOfElementsLine && lineNumber < numberOfOuterTrianglesLine) {
            objectData.outerTrianglesIndices = [ ...objectData.outerTrianglesIndices, ...line ];
          }

          line = [];
        } else if (character === ' ') {
          line.push(parseFloat(setOfCharacters));
          setOfCharacters = '';
        } else if (character !== '\r' && (character === '.' || !isNaN(parseFloat(character)))) {
          setOfCharacters += character;
        }
      }

      fs.unlink(path);

      return objectData;
    } catch (error) {
      console.error(error);

      return null;
    }
  }
}