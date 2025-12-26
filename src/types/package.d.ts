declare module '*/package.json' {
  const value: {
    name: string;
    version: string;
    [key: string]: any;
  };
  export = value;
}
