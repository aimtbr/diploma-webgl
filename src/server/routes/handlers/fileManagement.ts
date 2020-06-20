import { vec3 } from 'gl-matrix';
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
        normals: [] as number[],
      };

      const calculateTriangleNormal = (triangleVertices: number[][]): number[] => {
        const [x, y, z] = [0, 1, 2]; // aliases of indices of each vector
        const [vertexA, vertexB, vertexC] = triangleVertices;

        const firstVector = [ vertexB[x] - vertexA[x], vertexB[y] - vertexA[y], vertexB[z] - vertexA[z] ];
        const secondVector = [ vertexC[x] - vertexA[x], vertexC[y] - vertexA[y], vertexC[z] - vertexA[z] ];

        // cross product of vectors
        const [ crossX, crossY, crossZ ] = [
          (firstVector[y] * secondVector[z]) - (firstVector[z] * secondVector[y]), // X
          (firstVector[z] * secondVector[x]) - (firstVector[x] * secondVector[z]), // Y
          (firstVector[x] * secondVector[y]) - (firstVector[y] * secondVector[x]), // Z
        ];

        const normalizationValue = Math.sqrt(crossX ** 2 + crossY ** 2 + crossZ ** 2);
        const normal = [
          crossX / normalizationValue,
          crossY / normalizationValue,
          crossZ / normalizationValue,
        ];


        return normal;
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
            line.push(parseFloat(setOfCharacters));
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

            const outerTriangleVerticesCoords = line.reduce((accumulator: number[][], currentValue) => {
              const coordsLastIndex = currentValue * 3;
              const [ xIndex, yIndex, zIndex ] = [ coordsLastIndex, coordsLastIndex + 1, coordsLastIndex + 2 ];

              const x = objectData.vertices[xIndex];
              const y = objectData.vertices[yIndex];
              const z = objectData.vertices[zIndex];

              const vertexCoords = [ x, y, z ];

              return [ ...accumulator, vertexCoords ];
            }, []);

            const outerTriangleNormals = calculateTriangleNormal(outerTriangleVerticesCoords);

            objectData.normals.push(...outerTriangleNormals);
          }

          line = [];
        } else if (character === ' ') {
          line.push(parseFloat(setOfCharacters));
          setOfCharacters = '';
        } else if (character === '.' || (character !== '\r' && !isNaN(parseFloat(character)))) {
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