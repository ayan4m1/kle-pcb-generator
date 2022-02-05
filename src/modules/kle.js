import jsonfile from 'jsonfile';
import { Serial } from '@ijprest/kle-serial';

const { readFile } = jsonfile;

export const parseKleFile = async (path) =>
  Serial.deserialize(await readFile(path));
