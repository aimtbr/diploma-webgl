export function getCenterOfModel (vertices: number[]) {
  const minMaxCoords = [[0, 0], [0, 0], [0, 0]]; // the first nested array contains Z coord values

  vertices.forEach((coordValue: number, index: number) => {
    const adjustedIndex = index + 1;
    const coordIndex = adjustedIndex % 3;

    const currentMin = minMaxCoords[coordIndex][0];
    const currentMax = minMaxCoords[coordIndex][1];

    if (coordValue < currentMin) {
      minMaxCoords[coordIndex][0] = coordValue;
    }

    if (coordValue > currentMax) {
      minMaxCoords[coordIndex][1] = coordValue;
    }
  });

  const centerOfModel = minMaxCoords.map(([min, max]) => (max + min) / 2);
  centerOfModel.push(centerOfModel.shift()!); // move Z average value to the end

  return centerOfModel;
}