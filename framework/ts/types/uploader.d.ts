export type Uploader = (files: File[], options?: Partial<Options>) => Promise<Response>;

type Response = {
  statusCode: number;
  message: Upload[];
};

type Upload = {
  imgSize: Size | null;
  path: string;
  name: string;
  ext: string;
  dir: string
};

type Size = {
  width: number;
  height: number;
};

type File = {
  value: Buffer;
  options: {
    filename: string;
    contentType: string;
  };
};

type Options = {
  dir: string;
  ext: string;
  timeout: number;
  addToDb: boolean;
};
