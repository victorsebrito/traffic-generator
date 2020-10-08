import * as path from 'path';

let configPath;

export const setConfigPath = function(path: string) {
  configPath = path;
}

export default function (config: string): any {
  try {
    return require(path.join(process.cwd(), 'config', config));
  }
  catch (err) {
    // console.warn(err);
    return undefined;
  }
};