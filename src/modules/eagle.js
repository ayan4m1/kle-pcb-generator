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

      return `
ADD ${keySwitch}-${key.width}U ${label} (0 0);
ADD ${diode} D${label} R90 (0 0);
`;
    })
    .join('\n');

  return `${preamble}${main}${footer}`;
};

export const getBoardScript = (keyboard) => {
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
    .join('\n');

  const footer = `
RATSNEST;
WINDOW FIT;
`;

  return `${preamble}${main}${footer}`;
};
