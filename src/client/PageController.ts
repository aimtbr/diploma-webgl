import Cube from "./models/defaultCube.json";
import Canvas from "./Canvas/Canvas";

export default class PageController {
  canvas: Canvas | null = null;

  init () {
    try {
      this.canvas = new Canvas('root-canvas');
      // this.openPlayground();
      this.enableFileUploading();
    } catch (error) {
      console.error('Error occurred while initializing the PageController');
    }
  }

  

  protected enableFileUploading () {
    try {
      const dropboxArea = document.getElementById('dropbox-area');
      const fileInput = document.getElementById('dropbox-input');

      if (fileInput === null || this.canvas === null || dropboxArea === null) {
        alert('Something went wrong, try to reload the page');
        throw new Error('Error occurred while enabling the files uploading feature');
      }

      const fileUpload = async (file: File) => {
        const data = new FormData();
        data.append('model', file);

        const response = await fetch('/upload-model', {
          method: 'POST',
          body: data,
        });

        const objectData = await response.json();

        const setObjectDataResult = this.canvas.setObjectData(objectData);

        if (setObjectDataResult) {
          PageController.hideDropBoxArea();
        }
      };
      const dragOver = (event: DragEvent) => {
        event.stopPropagation();
        event.preventDefault();
      };
      const dragEnter = (event: DragEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const dropboxArea = event.target as HTMLInputElement;
        dropboxArea.classList.add('file-over');
      };
      const dragLeave = (event: DragEvent) => {
        event.stopPropagation();
        event.preventDefault();

        const dropboxArea = event.target as HTMLInputElement;
        dropboxArea.classList.remove('file-over');
      };
      const dragDrop = (event: DragEvent): boolean | void => {
        event.stopPropagation();
        event.preventDefault();

        dropboxArea.classList.remove('file-over');

        const { dataTransfer } = event;

        if (dataTransfer === null) {
          return false;
        }

        const { files } = dataTransfer;
        const file = files[0];

        fileUpload(file);
      };

      dropboxArea.ondragenter = dragEnter;
      dropboxArea.ondragover = dragOver;
      dropboxArea.ondragleave = dragLeave;
      dropboxArea.ondrop = dragDrop;
      fileInput.onchange = (event: Event) => {
        const file = event.target.files[0];

        fileUpload(file);
      };
    } catch (error) {
      console.error(error);
    }
  }

  static hideDropBoxArea () {
    const dropboxArea = document.getElementById('dropbox-area');

    if (dropboxArea !== null) {
      dropboxArea.style.display = 'none';
    }
  }

  openPlayground (): void {
    try {
      PageController.hideDropBoxArea();

      this.canvas.setObjectData(Cube);
    } catch (error) {
      console.error(error);
    }
  }
}