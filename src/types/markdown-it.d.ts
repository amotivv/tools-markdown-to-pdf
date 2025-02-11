declare module 'markdown-it' {
  export interface MarkdownItOptions {
    html?: boolean;
    xhtmlOut?: boolean;
    breaks?: boolean;
    langPrefix?: string;
    linkify?: boolean;
    typographer?: boolean;
    quotes?: string | string[];
    highlight?: (str: string, lang: string) => string;
  }

  interface Token {
    type: string;
    tag: string;
    attrs: [string, string][];
    children: Token[] | null;
    content: string;
    hidden: boolean;
    block: boolean;
    nesting: number;
    level: number;
    map: [number, number] | null;
    markup: string;
    info: string;
    meta: any;
    [key: string]: any;
  }

  interface MarkdownIt {
    render(src: string, env?: any): string;
    renderInline(src: string, env?: any): string;
    parse(src: string, env?: any): Token[];
    parseInline(src: string, env?: any): Token[];
  }

  interface MarkdownItConstructor {
    new (options?: MarkdownItOptions): MarkdownIt;
    (options?: MarkdownItOptions): MarkdownIt;
  }

  const MarkdownIt: MarkdownItConstructor;
  export default MarkdownIt;
}
