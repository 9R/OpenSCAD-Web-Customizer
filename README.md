# Client Side Browser Generator for Storage Boxes

This is mostly based on previous work by various people (see links below).
It is an abominable mix of code, but it hopefully works...

The Source of the OpenSCAD 3D-model is managed in a separate repo and can be
found [here](https://github.com/9R/Customizable-OpenSCAD-Storage-Box).

## Usage:

The openSCAD model needs be present in a zip archive in the web root.

The names of the openSCAD file as well as the name of the zip archive need to
be set in '''config.js'''. The output file name can also be set there.

In openscad-worker-inlined.js the URL of the directory where openscad.wasm is
served from also needs to be set.

## Future improvements:
- Improve OpenSCAD parameter parser
  - Add proper support for all scad variable type
- Refactor code so it isn't a nightmare
- Allow saving state in browser
- Improve user input validation
- Improve 3D view, button to reset view to start and correct zoom etc.

All credit goes to their respective owners, all mistakes and fuckups are mine.

[gridfinity Generator with hack style sheet]
(https://github.com/vector76/gridfinity-openscad)

[Gridfinity-Generator]
(https://github.com/Hamza-Anver/Gridfinity-Generator)

[CSS theme template for this site]
(https://sukima.github.io/hackcss-ext/">hack.css)

[For OpenSCAD Web Assembly](https://github.com/ochafik/openscad-wasm)

