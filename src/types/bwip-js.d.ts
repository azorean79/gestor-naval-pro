declare module "bwip-js" {
  interface BwipJsOptions {
    bcid: string;
    text: string;
    scale?: number;
    includetext?: boolean;
    textxalign?: string;
    textsize?: number;
    paddingwidth?: number;
    paddingheight?: number;
    [key: string]: unknown;
  }

  interface BwipJs {
    toBuffer(options: BwipJsOptions): Promise<Buffer>;
    toSVG(options: BwipJsOptions): Promise<string>;
    toCanvas(canvas: HTMLCanvasElement, options: BwipJsOptions): void;
  }

  const bwipjs: BwipJs;
  export default bwipjs;
}
