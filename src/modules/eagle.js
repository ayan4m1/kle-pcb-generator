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

export const getSchematicScript = (keyboard, diode, keySwitch) => {
  const diodeOffset = [0.1, 0.7];
  const switchOffset = [0.8, 1.7];
  const diodeSize = [0.2, 0.4];

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
  const lastPositions = new Map();

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

      const { x, y, width } = key;
      const row = Math.floor(y) + 1;
      const nets = [];

      let keyWidth = width;

      if (!keyWidths.includes(width)) {
        keyWidth = Math.floor(width);
      }

      const switchPos = [x * switchOffset[0], y * -switchOffset[1]];

      if (width > 1) {
        switchPos[0] += (switchOffset[0] * (width - 1)) / 2;
      }

      const diodePos = [
        switchPos[0] + diodeOffset[0],
        switchPos[1] + diodeOffset[1]
      ];

      if (lastPositions.has(row)) {
        const rowPositions = lastPositions.get(row);
        const lastDiodePos = rowPositions[rowPositions.length - 1];

        nets.push(
          `NET ROW${row} (${diodePos[0].toFixed(2)} ${(
            diodePos[1] +
            diodeSize[1] / 2
          ).toFixed(2)}) (${lastDiodePos[0].toFixed(2)} ${(
            diodePos[1] +
            diodeSize[1] / 2
          ).toFixed(2)})`
        );
        rowPositions.push(diodePos);
      } else {
        lastPositions.set(row, [diodePos]);
      }

      nets.push(
        `NET (${diodePos[0].toFixed(2)} ${(
          diodePos[1] -
          diodeSize[1] / 2
        ).toFixed(2)}) (${diodePos[0].toFixed(2)} ${(
          diodePos[1] -
          0.1 -
          diodeSize[1] / 2
        ).toFixed(2)})`
      );

      return `
ADD KEYSWITCH-PLAIN-${keySwitch}-${keyWidth}U ${label} (${switchPos[0].toFixed(
        2
      )} ${switchPos[1].toFixed(2)});
ADD ${diode} D${label} R90 (${diodePos[0].toFixed(2)} ${diodePos[1].toFixed(
        2
      )});
${nets.join('\n')}
`;
    })
    .join('');

  return `${preamble}${main}${footer}`;
};

export const getBoardScript = (keyboard) => {
  // const diodeOffset = [];
  // const switchOffset = [19.05, 19.05];

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
MOVE D${label} (0 0);
`;
    })
    .join('');

  const footer = `
RATSNEST;
WINDOW FIT;
`;

  return `${preamble}${main}${footer}`;
};
