export const GlobalWorkerOptions = {
  workerSrc: '',
};

export function getDocument() {
  return {
    promise: Promise.reject(new Error('pdfjs-dist is not available in this build environment')),
  };
}
