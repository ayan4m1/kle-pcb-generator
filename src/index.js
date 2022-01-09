import { basename, join, dirname } from 'path';
import { Command } from 'commander';

import { getBoardScript, getSchematicScript } from './modules/eagle.js';
import { parseKleFile } from './modules/kle.js';
import { getLogger } from './modules/logging.js';

const log = getLogger('app');
const program = new Command();

program
  .version('0.1.0')
  .arguments('<input>')
  .option('-d, --diode <name>', 'Diode part name')
  .option('-k, --key-switch <name>', 'Keyswitch part name')
  .action(async (input, options) => {
    let diode = 'DIODE-DO-35';

    if (options.diode) {
      diode = options.diode.toUpperCase();
    }

    let keySwitch = 'KEYSWITCH-PLAIN-ALPSMX';

    if (options.keySwitch) {
      keySwitch = options.keySwitch.toUpperCase();
    }

    const fileName = basename(input, '.json');
    const outputSchematic = join(dirname(input), `${fileName}.sch`);
    const outputBoard = join(dirname(input), `${fileName}.brd`);
    const keyboard = await parseKleFile(input);

    log.info(input);
    log.info(outputSchematic);
    log.info(outputBoard);
    log.info(diode);
    log.info(keySwitch);

    const schematicScript = getSchematicScript(keyboard, diode, keySwitch);
    const boardScript = getBoardScript(keyboard);

    console.dir(schematicScript);
    console.dir(boardScript);
  });

program.parse(process.argv);
