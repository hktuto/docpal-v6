import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
// import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker?url'

// Configure the worker
console.log('pdfjsWorker', pdfjsLib)
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default defineNuxtPlugin(() => {
  return {
    provide: {
      pdfjs: pdfjsLib
    }
  }
})
