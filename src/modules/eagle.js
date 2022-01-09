const keyMap = new Map();

keyMap.set('-', 'DASH');
keyMap.set('=', 'EQUAL');
keyMap.set('+', 'PLUS');
keyMap.set(',', 'COMMA');
keyMap.set('.', 'PERIOD');
keyMap.set('/', 'SLASH');
keyMap.set('\\', 'SOLIDUS');
keyMap.set('[', 'LBRACKET');
keyMap.set(']', 'RBRACKET');
keyMap.set(';', 'SEMI');
keyMap.set("'", 'QUOTE');
keyMap.set('CAPS LOCK', 'CAPSLK');

const keyWidths = [1, 2, 4, 6, 6.25, 7];

export const diodes = new Map();

diodes.set('tht', 'DIODE-DO-35');
diodes.set('smd', 'DIODE-SOD-123');

export const keySwitches = new Map();

keySwitches.set('alps', 'ALPS');
keySwitches.set('alpsMx', 'ALPSMX');
keySwitches.set('choc', 'CHOC');
keySwitches.set('chocX', 'CHOCX');
keySwitches.set('mx', 'MX');
keySwitches.set('mxHs', 'MXHS');
keySwitches.set('mxHsPcb', 'MXHSPCB');

const getLabel = (key) => {
  if (!key.labels.length) {
    if (key.width >= 3) {
      return 'SPACE';
    }

    throw new Error(`Unable to map key with no label at XY ${key.x} ${key.y}`);
  }

  let label = key.labels[key.labels.length - 1].toUpperCase();

  if (keyMap.has(label)) {
    label = keyMap.get(label);
  }

  return label;
};

export const getSchematicScript = (keyboard, options) => {
  const diode = diodes.get(options.diode);
  const keySwitch = keySwitches.get(options.keySwitch);

  if (!diode) {
    throw new Error('Invalid diode specified!');
  }

  if (!keySwitch) {
    throw new Error('Invalid key switch specified!');
  }

  if (!keyboard.keys.length) {
    throw new Error('No keys on keyboard!');
  }

  const diodeOffset = [0.1, 0.7];
  const switchOffset = [1, 1.7];
  const diodeSize = [0.2, 0.4];
  const switchSize = [0.6, 0.6];

  const preamble = `
GRID ON;
GRID IN 0.1 1;
GRID ALT IN 0.01;
SET WIRE_BEND 2;
`;

  const footer = `
WINDOW FIT;
`;

  const labelMap = new Map();
  const rowSwitches = new Map();
  const colSwitches = new Map();
  const labels = [];

  const main = keyboard.keys
    .map((key) => {
      let label = getLabel(key);

      if (!labelMap.has(label)) {
        labelMap.set(label, 1);
      } else {
        const index = labelMap.get(label) + 1;

        label = `${label}${index}`;
        labelMap.set(label, index);
      }

      const { x, y, width, height } = key;
      const row = Math.floor(y) + 1;
      const col = Math.floor(x) + 1;
      const nets = [];

      let keyWidth = width;

      if (!keyWidths.includes(width)) {
        keyWidth = Math.floor(width);
      }

      const switchPos = [x * switchOffset[0], y * -switchOffset[1]];

      if (options.centerSwitches && width > 1) {
        switchPos[0] += (switchOffset[0] * (width - 1)) / 2;
      }

      const diodePos = [
        switchPos[0] + diodeOffset[0],
        switchPos[1] + diodeOffset[1]
      ];

      if (rowSwitches.has(row)) {
        const rowPositions = rowSwitches.get(row);
        const lastDiodePos = rowPositions[rowPositions.length - 1];

        nets.push(`
NET ROW${row} (${diodePos[0].toFixed(2)} ${(
          diodePos[1] +
          diodeSize[1] / 2
        ).toFixed(2)}) (${lastDiodePos[0].toFixed(2)} ${(
          diodePos[1] +
          diodeSize[1] / 2
        ).toFixed(2)})
          `);
        rowPositions.push(diodePos);
      } else {
        rowSwitches.set(row, [diodePos]);

        labels.push(`
LABEL (${diodePos[0].toFixed(2)} ${(diodePos[1] + diodeSize[1] / 2).toFixed(
          2
        )}) R0 (${diodePos[0].toFixed(2)} ${(
          diodePos[1] +
          0.1 +
          diodeSize[1] / 2
        ).toFixed(2)})
`);
      }

      if (colSwitches.has(col)) {
        const colPositions = colSwitches.get(col);
        const lastSwitchPos = colPositions[colPositions.length - 1];

        if (options.centerSwitches && width > 1) {
          nets.push(`
NET COL${col} (${(x * switchOffset[0] - 0.1 - switchSize[0] / 2).toFixed(2)} ${(
            switchPos[1] + 0.1
          ).toFixed(2)}) (${(
            x * switchOffset[0] -
            0.1 -
            switchSize[0] / 2
          ).toFixed(2)} ${(lastSwitchPos[1] + 0.1).toFixed(2)})
`);
          nets.push(`
NET COL${col} (${(x * switchOffset[0] - 0.1 - switchSize[0] / 2).toFixed(2)} ${(
            switchPos[1] + 0.1
          ).toFixed(2)}) (${(switchPos[0] - 0.1).toFixed(2)} ${(
            switchPos[1] + 0.1
          ).toFixed(2)})
`);
        } else {
          nets.push(`
NET COL${col} (${(switchPos[0] - 0.1 - switchSize[0] / 2).toFixed(2)} ${(
            switchPos[1] + 0.1
          ).toFixed(2)}) (${(switchPos[0] - 0.1 - switchSize[0] / 2).toFixed(
            2
          )} ${(lastSwitchPos[1] + 0.1).toFixed(2)})
`);
        }
        colPositions.push(switchPos);
      } else {
        colSwitches.set(col, [switchPos]);

        labels.push(`
LABEL (${(switchPos[0] - 0.1 - switchSize[0] / 2).toFixed(
          2
        )} ${switchPos[1].toFixed(2)}) R270 (${(
          switchPos[0] -
          0.2 -
          switchSize[0] / 2
        ).toFixed(2)} ${switchPos[1].toFixed(2)})
`);
      }

      nets.push(`
NET (${diodePos[0].toFixed(2)} ${(diodePos[1] - diodeSize[1] / 2).toFixed(
        2
      )}) (${diodePos[0].toFixed(2)} ${(
        diodePos[1] -
        0.1 -
        diodeSize[1] / 2
      ).toFixed(2)});
`);

      let suffix = '';

      if (height > 1) {
        keyWidth = height;
        suffix = '-ROTATED';
      }

      return `
ADD KEYSWITCH-PLAIN-${keySwitch}-${keyWidth}U${suffix} ${label} (${switchPos[0].toFixed(
        2
      )} ${switchPos[1].toFixed(2)});
ADD ${diode} D${label} R90 (${diodePos[0].toFixed(2)} ${diodePos[1].toFixed(
        2
      )});
${nets.join('')}`;
    })
    .join('');

  return `${preamble}${main}${labels.join('')}${footer}`;
};

export const getBoardScript = (keyboard) => {
  // const diodeOffset = [];
  // const switchOffset = [19.05, 19.05];

  if (!keyboard.keys.length) {
    throw new Error('No keys on keyboard!');
  }

  const preamble = `
GRID ON;
GRID MM 1 10;
GRID ALT MM .1;
`;

  const main = keyboard.keys
    .map((key) => {
      const label = getLabel(key);

      return `
ROTATE R180 ${label};
MOVE ${label} (0 0);
ROTATE R270 D${label};
MOVE D${label} (0 0);`;
    })
    .join('\n');

  const footer = `
RATSNEST;
WINDOW FIT;
`;

  return `${preamble}${main}${footer}`;
};
