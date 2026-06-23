import 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    svg(
      element: Element,
      options?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    ): Promise<void>;
  }
}
