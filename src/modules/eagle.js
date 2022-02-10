const keyMap = new Map();

// remap keys with symbol/long names when generating part names
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
keyMap.set('SCROLL LOCK', 'SCRLK');
keyMap.set('CAPS LOCK', 'CAPSLK');
keyMap.set('NUM LOCK', 'NUMLK');
keyMap.set('↑', 'UP');
keyMap.set('↓', 'DOWN');
keyMap.set('←', 'LEFT');
keyMap.set('→', 'RIGHT');
keyMap.set('*', 'ASTERISK');
keyMap.set('#', 'HASH');

// keys that we have socket/stabilizer patterns for
const keyWidths = [1, 2, 4, 6, 6.25, 7];

export const diodes = new Map();

// EAGLE library diode types
diodes.set('tht', 'DIODE-DO-35');
diodes.set('smd', 'DIODE-SOD-123');

export const keySwitches = new Map();

// EAGLE library switch mount types
keySwitches.set('alps', 'ALPS');
keySwitches.set('alpsMx', 'ALPSMX');
keySwitches.set('choc', 'CHOC');
keySwitches.set('chocX', 'CHOCX');
keySwitches.set('mx', 'MX');
keySwitches.set('mxHs', 'MXHS');
keySwitches.set('mxHsPcb', 'MXHSPCB');

const getLabel = (key, labels) => {
  let label;

  if (key.labels.length) {
    label = key.labels[key.labels.length - 1].toUpperCase();
  } else if (key.width >= 3) {
    label = 'SPACE';
  } else {
    label = 'BLANK';
  }

  if (keyMap.has(label)) {
    label = keyMap.get(label);
  }

  if (!labels.has(label)) {
    labels.set(label, 1);
  } else {
    const index = labels.get(label) + 1;

    labels.set(label, index);
    label = `${label}${index}`;
  }

  return label;
};

const offsets = {
  diode: {
    schematic: [0.1, 0.7],
    board: 2
  },
  switch: {
    schematic: [1, 1.7],
    board: 19.05
  }
};

const sizes = {
  diode: [0.2, 0.4],
  switch: [0.6, 0.6]
};

const calcPositions = ({ x, y, width, height }, options) => {
  const positions = {
    switch: {
      board: [x * offsets.switch.board, y * -offsets.switch.board],
      schematic: [
        x * offsets.switch.schematic[0],
        y * -offsets.switch.schematic[1]
      ]
    }
  };

  if (options.centerSwitches && width > 1) {
    positions.switch.schematic[0] +=
      (offsets.switch.schematic[0] * (width - 1)) / 2;
  }

  if (options.centerSwitches && height > 1) {
    positions.switch.schematic[1] -=
      (offsets.switch.schematic[1] * (height - 1)) / 2;
  }

  positions.switch.schematic[0] = parseFloat(
    positions.switch.schematic[0].toPrecision(2)
  );
  positions.switch.schematic[1] = parseFloat(
    positions.switch.schematic[1].toPrecision(2)
  );

  if (width > 1) {
    positions.switch.board[0] += (offsets.switch.board * (width - 1)) / 2;
  }

  if (height > 1) {
    positions.switch.board[1] -= (offsets.switch.board * (height - 1)) / 2;
  }

  positions.diode = {
    board: [
      positions.switch.board[0] - (width * offsets.switch.board) / 2,
      positions.switch.board[1] + offsets.diode.board
    ],
    schematic: [
      positions.switch.schematic[0] + offsets.diode.schematic[0],
      positions.switch.schematic[1] + offsets.diode.schematic[1]
    ]
  };

  return positions;
};

const coords = ([x, y]) => `(${x.toFixed(2)} ${y.toFixed(2)})`;

const generateSwitch = (keySwitch, height, width, label, position) => {
  let keyWidth = width;

  if (!keyWidths.includes(width)) {
    keyWidth = Math.floor(width);
  }

  let suffix = '';

  if (height > 1) {
    keyWidth = height;
    suffix = '-ROTATED';
  }

  return `
ADD KEYSWITCH-PLAIN-${keySwitch}-${keyWidth}U${suffix} ${label} ${coords(
    position
  )};
`;
};

const generateDiode = (diode, label, position) => `
ADD ${diode} D${label} R90 ${coords(position)};
`;

const generateLabel = (netPosition, rotation, position) => `
LABEL ${coords(netPosition)} R${rotation} ${coords(position)};
`;

const generateNet = (name, start, end) => `
NET ${name} ${coords(start)} ${coords(end)};
`;

const placeSwitch = (label, position) => `
ROTATE =R0 ${label};
MIRROR ${label};
MOVE ${label} ${coords(position)};
`;

const placeDiode = (label, position) => `
ROTATE =R90 D${label};
MOVE D${label} ${coords(position)};
`;

export const parseLayout = (keyboard, options) => {
  if (!keyboard.keys.length) {
    throw new Error('No keys on keyboard!');
  }

  const diode = diodes.get(options.diode);
  const keySwitch = keySwitches.get(options.keySwitch);

  if (!diode) {
    throw new Error('Invalid diode specified!');
  }

  if (!keySwitch) {
    throw new Error('Invalid key switch specified!');
  }

  let lastX = 0,
    lastY = 0,
    lastKey = { x: 0, y: 0 };

  const labelMap = new Map();
  const keys = keyboard.keys.map((key) => {
    const label = getLabel(key, labelMap);
    const deltaX = lastKey.x - key.x;
    const deltaY = lastKey.y - key.y;

    if (deltaY < 0) {
      lastY++;
      lastX = 0;
    }

    if (deltaY === 0 && deltaX < 0) {
      lastX++;
    }

    lastKey = key;

    return {
      key,
      row: lastY + 1,
      col: lastX + 1,
      label,
      positions: calcPositions(key, options)
    };
  });

  return {
    keys,
    diode,
    keySwitch
  };
};

export const getSchematicScript = ({ keys, diode, keySwitch }) => {
  const header = `
GRID ON;
GRID IN 0.1 1;
GRID ALT IN 0.01;
SET WIRE_BEND 2;
`;

  const footer = `
WINDOW FIT;
`;

  const switches = keys
    .map(({ label, key: { height, width }, positions }) =>
      generateSwitch(
        keySwitch,
        height,
        width,
        label,
        positions.switch.schematic
      )
    )
    .join('');
  const diodes = keys
    .map(({ label, positions }) =>
      generateDiode(diode, label, positions.diode.schematic)
    )
    .join('');

  const rowSwitches = new Map();
  const colSwitches = new Map();

  const labels = [];
  const nets = keys
    .flatMap(({ row, col, positions }) => {
      const lines = [];
      const switchPos = positions.switch.schematic;
      const diodePos = positions.diode.schematic;

      if (rowSwitches.has(row)) {
        const rowPositions = rowSwitches.get(row);
        const lastDiodePos = rowPositions[rowPositions.length - 1];
        const netName = `ROW${row}`;

        rowPositions.push(diodePos);

        if (lastDiodePos[1] !== diodePos[1]) {
          lines.push(
            generateNet(
              netName,
              [diodePos[0], lastDiodePos[1] + sizes.diode[1] / 2],
              [lastDiodePos[0], lastDiodePos[1] + sizes.diode[1] / 2]
            ),
            generateNet(
              netName,
              [diodePos[0], lastDiodePos[1] + sizes.diode[1] / 2],
              [diodePos[0], diodePos[1] + sizes.diode[1] / 2]
            )
          );
        } else {
          lines.push(
            generateNet(
              netName,
              [diodePos[0], diodePos[1] + sizes.diode[1] / 2],
              [lastDiodePos[0], diodePos[1] + sizes.diode[1] / 2]
            )
          );
        }
      } else {
        rowSwitches.set(row, [diodePos]);

        labels.push(
          generateLabel([diodePos[0], diodePos[1] + sizes.diode[1] / 2], 0, [
            diodePos[0],
            diodePos[1] + 0.1 + sizes.diode[1] / 2
          ])
        );
      }

      if (colSwitches.has(col)) {
        const colPositions = colSwitches.get(col);
        const lastSwitchPos = colPositions[colPositions.length - 1];
        const netName = `COL${col}`;

        colPositions.push(switchPos);

        if (lastSwitchPos[0] !== switchPos[0]) {
          lines.push(
            generateNet(
              netName,
              [switchPos[0] - 0.1 - sizes.switch[0] / 2, switchPos[1] + 0.1],
              [
                lastSwitchPos[0] - 0.1 - sizes.switch[0] / 2,
                lastSwitchPos[1] + 0.1
              ]
            )
          );
        } else {
          lines.push(
            generateNet(
              netName,
              [switchPos[0] - 0.1 - sizes.switch[0] / 2, switchPos[1] + 0.1],
              [switchPos[0] - 0.1 - sizes.switch[0] / 2, lastSwitchPos[1] + 0.1]
            )
          );
        }
      } else {
        colSwitches.set(col, [switchPos]);

        labels.push(
          generateLabel(
            [switchPos[0] - 0.1 - sizes.switch[0] / 2, switchPos[1]],
            270,
            [switchPos[0] - 0.2 - sizes.switch[0] / 2, switchPos[1]]
          )
        );
      }

      return lines;
    })
    .join('');

  return `${header}${switches}${diodes}${nets}${labels.join('')}${footer}`;
};

export const getBoardScript = ({ keys }) => {
  const header = `
GRID ON;
GRID MM 0.79375 24;
GRID ALT MM .1;
`;

  const switches = keys
    .map(({ label, positions }) => placeSwitch(label, positions.switch.board))
    .join('');
  const diodes = keys
    .map(({ label, positions }) => placeDiode(label, positions.diode.board))
    .join('');

  const footer = `
RATSNEST;
WINDOW FIT;
`;

  return `${header}${switches}${diodes}${footer}`;
};
