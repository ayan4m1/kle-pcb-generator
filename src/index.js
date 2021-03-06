import { basename, join, dirname } from 'path';
import { Command } from 'commander';
import { writeFile } from 'fs/promises';

import {
  diodes,
  getBoardScript,
  getSchematicScript,
  keySwitches,
  parseLayout
} from './modules/eagle.js';
import { parseKleFile } from './modules/kle.js';
import { getLogger } from './modules/logging.js';

const log = getLogger('app');
const program = new Command();

program.version('0.1.0');

program
  .command('convert', {
    isDefault: true
  })
  .description('converts a KLE JSON into EAGLE scripts')
  .arguments('<input>')
  .option('-d, --diode <name>', 'Diode part name', 'tht')
  .option('-k, --key-switch <name>', 'Keyswitch part name', 'mxHsPcb')
  .option('-c, --center-switches', 'Center switches in schematic')
  .option('-d, --duplex, --duplex-matrix', 'Generate duplex matrix')
  .action(async (input, options) => {
    try {
      const fileName = basename(input, '.json');
      const outputSchematic = join(dirname(input), `${fileName}-schematic.scr`);
      const outputBoard = join(dirname(input), `${fileName}-board.scr`);

      log.info(`Parsing ${input}`);

      const keyboard = await parseKleFile(input);
      const layout = parseLayout(keyboard, options);
      const schematicScript = getSchematicScript(layout);
      const boardScript = getBoardScript(layout);

      log.info('Creating schematic script');
      await writeFile(outputSchematic, schematicScript);
      log.info('Creating board script');
      await writeFile(outputBoard, boardScript);
    } catch (error) {
      log.error(error.message);
      log.error(error.stack);
    }
  });

program
  .command('parts')
  .description('list available parts')
  .action(() => {
    log.info('Diodes:');
    for (const [name, value] of diodes.entries()) {
      log.info(`\t${name} - ${value}`);
    }
    log.info('Switches:');
    for (const [name, value] of keySwitches.entries()) {
      log.info(`\t${name} - KEYSWITCH-PLAIN-${value}`);
    }
  });

program.parse(process.argv);
