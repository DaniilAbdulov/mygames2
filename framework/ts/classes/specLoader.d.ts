declare class SpecLoader {
  constructor(find: string, specFolder: string);
  resolve(): Promise<string>  | never
}

export = SpecLoader;
