# kle-pcb-generator

This is a Node script which can transform JSON files from Keyboard-Layout-Editor into Autodesk EAGLE scripts which will generate a schematic and board for a given keyboard layout.

## features

 * SMD or THT diodes
 * Alps, Alps-MX, Choc, Choc X, or Hotswap switches
 * Variable width/height keys
 * Stabilizers for >= 2U keys
 * Traditional or duplex matrix wiring

## not supported

 * Rotated keys
 * Stepped keys (ISO enter)

## usage

First, clone this repo. Then, open a terminal in the clone directory. Execute

```sh
npm i
```

Then, to run the script, use

```sh
node src/index.js example.json
```

Where example.json is a KLE JSON file in the same directory.

To get a list of the diodes and switches you can use, run `node src/index.js parts`.
