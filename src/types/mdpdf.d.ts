declare module 'mdpdf' {
  interface MdPdfOptions {
    source: string;
    style?: string;
    format?: 'a4' | 'letter' | 'legal' | string;
    ghStyle?: boolean;
    border?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    orientation?: 'portrait' | 'landscape';
    header?: string;
    footer?: string;
    headerHeight?: string;
    footerHeight?: string;
    debug?: boolean;
  }

  interface MdPdf {
    convert(options: MdPdfOptions): Promise<Buffer>;
  }

  const mdpdf: MdPdf;
  export = mdpdf;
}
