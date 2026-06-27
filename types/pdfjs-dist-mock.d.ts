/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock type definitions for pdfjs-dist to bypass corrupted library types in tsconfig paths
declare module 'pdfjs-dist' {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
  export const version: string;
  export class PDFPageProxy {
    getTextContent(params?: any): Promise<any>;
  }
}

declare module 'pdfjs-dist/types/src/display/api.js' {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
  export const version: string;
  export class PDFPageProxy {
    getTextContent(params?: any): Promise<any>;
  }
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const getDocument: any;
  export const GlobalWorkerOptions: any;
  export const version: string;
  export class PDFPageProxy {
    getTextContent(params?: any): Promise<any>;
  }
}
