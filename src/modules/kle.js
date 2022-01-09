import jsonfile from 'jsonfile';
import { Serial } from '@ijprest/kle-serial';

const { readFile } = jsonfile;

export const parseKleFile = async (path) => {
  const data = await readFile(path);
  return Serial.deserialize(data);
};
