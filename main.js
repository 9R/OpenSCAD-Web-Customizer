import { spawnOpenSCAD } from './openscad-runner.js'
import { buildFeatureCheckboxes } from './features.js';

const renderButton = document.getElementById('render');
const killButton = document.getElementById('kill');
const metaElement = document.getElementById('header-message');
const linkContainerElement = document.getElementById('download-link');

const stlViewerElement = document.getElementById("viewer");
const logsElement = document.getElementById("logs");
const featuresContainer = document.getElementById("features");
const flipModeButton = document.getElementById("flip-mode");
const colorPicker = document.getElementById("colorpicker");
const resetDefaults = document.getElementById("reset_default");
const settingsButton = document.getElementById("viewer-settings");
const settingsMenu = document.getElementById("settings-menu");

const pageTitle = document.getElementById("page-title");

const renderInfoButton = document.getElementById('render-info');
const renderInfo = document.getElementById('render-info-menu');

const bgColor = document.getElementById("bg-color");
const stlColor = document.getElementById("stl-color");
const gridLines = document.getElementById("gridlines");

const queryParams = new URLSearchParams(location.search);

// Does not exist but a pain to change
const autorotateCheckbox = document.getElementById('autorotate');
const autorotateButton = document.getElementById('autorotate')

import {config} from './config.js';

const {model_parameter_defaults, model_parameter_descriptions} = await processOpenSCADFromZip(config.zip_archive);
	  
// Not an elegant approach but it should work
// Will probably regret later if I work on it
// Seems to be a theme now
const model_parameter_mappings = {
    Normal: "normal",
    Reduced: "reduced",
    None: "none",
    "No Label": "disabled",
    Left: "left",
    Right: "right",
    Center: "center",
    "Left Chamber": "leftchamber",
    "Right Chamber": "rightchamber",
    "Center Chamber": "centerchamber",
};

const model_path = config.zip_archive.replace(".zip","/") + config.model_filename;

function paramSetDefaults() {
    for (var param in model_parameter_defaults) {
        const defaultValue = model_parameter_defaults[param];
        const propType = typeof model_parameter_defaults[param];

        var propElt = document.getElementById(param);
        if (propType == "boolean") {
            propElt.checked = defaultValue;
        } else {
            propElt.value = defaultValue;
        }


    }
}


(async () => {
    if ('serviceWorker' in navigator) {
        for (const reg of await navigator.serviceWorker.getRegistrations()) {
            try {
                reg.unregister()
            } catch (e) {
                console.error(e, e.stackTrace);
            }
        }
    }
})();

function getFormProp(prop) {
    const propType = typeof model_parameter_defaults[prop];
    const propElt = document.getElementById(prop);
    if (propType == "boolean") {
        return propElt.checked;
    }
    else if (propType === "number") {
        return Number(propElt.value);
    }
    else {
        const mappedString = model_parameter_mappings[propElt.value];
        return String(mappedString);  // force to string after mapping
    }
}

const settings_defaults = {
    bgColor: "#ebebeb",
    stlColor: "#737373",
    gridLines: false,
};

function settingsDefault() {
    bgColor.value=settings_defaults["bgColor"];
    stlColor.value=settings_defaults["stlColor"];
    gridLines.checked = settings_defaults["gridLines"];

};

settingsDefault();

var settingsVis = false;

function SettingsMenuToggle(){
    if(settingsVis){
        settingsMenu.classList.add('hide');
        settingsButton.classList.add('btn-ghost');
    }else{
        settingsMenu.classList.remove('hide');
        settingsButton.classList.remove('btn-ghost');
    }
    settingsVis= !(settingsVis);
};

settingsButton.onclick = () => {
    if(renderinfoVis){
        renderInfoToggle();
    }
    SettingsMenuToggle();
};

var renderinfoVis = false;

function renderInfoToggle(){
    if(renderinfoVis){
        renderInfo.classList.add('hide');
        renderInfoButton.classList.add('btn-ghost');
    }else{
        renderInfo.classList.remove('hide');
        renderInfoButton.classList.remove('btn-ghost');
    }
    renderinfoVis= !(renderinfoVis);
};

renderInfoButton.onclick = () => {
    if(settingsVis){
        SettingsMenuToggle();
    }
    renderInfoToggle();
};

stlColor.onchange = () => {
    stlViewer.set_color(model_id, stlColor.value)
};

gridLines.onchange = () => {
    stlViewer.set_grid(gridLines.checked);
};

bgColor.onchange = () => {
    stlViewer.set_bg_color(bgColor.value);
};


var cameraStartState = {
    "position": {
      "x": 91.44090197259156,
      "y": 73.79826512044899,
      "z": 72.62376999581453
    },
    "up": {
      "x": 0,
      "y": 1,
      "z": 0
    },
    "target": {
      "x": 0,
      "y": 0,
      "z": 0
    }
};

const featureCheckboxes = {};

var persistCameraState = false;
var stlViewer;
var stlFile;
var model_id;

function buildStlViewer() {
    const stlViewer = new StlViewer(stlViewerElement);
    stlViewer.model_loaded_callback = id => {
        model_id = id;
        stlViewer.set_grid(gridLines.checked);
        stlViewer.set_bg_color(bgColor.value);
        stlViewer.set_color(id, stlColor.value);
        stlViewer.set_camera_state(cameraStartState);
        stlViewer.set_auto_zoom(true);
        stlViewer.set_auto_resize(true);
    };
    return stlViewer;
}

function viewStlFile() {
    try { stlViewer.remove_model(1); } catch (e) { }
    stlViewer.add_model({ id: 1, local_file: stlFile, rotationx: -1.5708 });
}

function addDownloadLink(container, blob, fileName) {
    container.innerText = "Download";
    container.href = URL.createObjectURL(blob);
    container.download = fileName;
    container.classList.remove("btn-ghost");
    return container;
}

function formatMillis(n) {
    if (n < 1000) {
        return `${Math.floor(n / 1000)}s`;
    }
    return `${Math.floor(n / 100) / 10}s`;
}

let lastJob;

killButton.onclick = () => {
    if (lastJob) {
        lastJob.kill();
        lastJob = null;
    }
};

autorotateButton.onclick = () => {
    autorotate= !(autorotate);
    if(autorotate){
        autorotateButton.classList.remove('btn-ghost');
    }else{
        autorotateButton.classList.add('btn-ghost');
    }
    stlViewer.set_auto_rotate(autorotate);
    
};

function setAutoRotate(value) {
    autorotateCheckbox.checked = value;
    stlViewer.set_auto_rotate(value);
}

function isViewerFocused() {
    return stlViewerElement.classList.contains('focused');
}

function setExecuting(v) {
    killButton.disabled = !v;
}

var lastProcessedOutputsTimestamp;

function processMergedOutputs(mergedOutputs, timestamp) {
    if (lastProcessedOutputsTimestamp != null && timestamp < lastProcessedOutputsTimestamp) {
        // We have slow (render) and fast (syntax check) runs running concurrently.
        // The results of slow runs might be out of date now.
        return;
    }
    lastProcessedOutputsTimestamp = timestamp;

    let unmatchedLines = [];
    let allLines = [];

    const markers = [];
    let warningCount = 0, errorCount = 0;
    const addError = (error, file, line) => {
    }
    for (const { stderr, stdout, error } of mergedOutputs) {
        allLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
        if (stderr) {
            if (stderr.startsWith('ERROR:')) errorCount++;
            if (stderr.startsWith('WARNING:')) warningCount++;

            let m = /^ERROR: Parser error in file "([^"]+)", line (\d+): (.*)$/.exec(stderr)
            if (m) {
                continue;
            }

            m = /^ERROR: Parser error: (.*?) in file ([^",]+), line (\d+)$/.exec(stderr)
            if (m) {
                continue;
            }

            m = /^WARNING: (.*?),? in file ([^,]+), line (\d+)\.?/.exec(stderr);
            if (m) {
                continue;
            }
        }
        unmatchedLines.push(stderr ?? stdout ?? `EXCEPTION: ${error}`);
    }
    if (errorCount || warningCount) unmatchedLines = [`${errorCount} errors, ${warningCount} warnings!`, '', ...unmatchedLines];

    logsElement.innerText = allLines.join("\n")
}

var sourceFileName;

function turnIntoDelayableExecution(delay, createJob) {
    var pendingId;
    var runningJobKillSignal;

    const doExecute = async () => {
        if (runningJobKillSignal) {
            runningJobKillSignal();
            runningJobKillSignal = null;
        }
        const { kill, completion } = createJob();
        runningJobKillSignal = kill;
        try {
            await completion;
        } finally {
            runningJobKillSignal = null;
        }
    }
    return async ({ now }) => {
        if (pendingId) {
            clearTimeout(pendingId);
            pendingId = null;
        }
        if (now) {
            doExecute();
        } else {
            pendingId = setTimeout(doExecute, delay);
        }
    };
}

var renderDelay = 1000;
const render = turnIntoDelayableExecution(renderDelay, () => {
    const source = 'include <' + model_path + '>';
    const model_dir = model_path.split(/[\\/]/)[0];                              
    const timestamp = Date.now();
    metaElement.innerHTML = '- Rendering <span class="loader-dots"></span>';
    pageTitle.innerText = 'Rendering...';
    metaElement.title = null;
    renderButton.disabled = true;
    setExecuting(true);

    var arglist = [
        "input.scad",
        "-o", config.output_filename,
        ...Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked).map(f => `--enable=${f}`),
    ];

    // add model parameters
    for (var prop in model_parameter_defaults) {
        if (typeof model_parameter_defaults[prop] == "string") {
            arglist.push("-D", prop + '="' + getFormProp(prop) + '"');
        }
        else {
            // number and boolean work with ordinary typecasting
            arglist.push("-D", prop + "=" + getFormProp(prop));
        }
    }

    // console.log(arglist);

    const job = spawnOpenSCAD({
        inputs: [['input.scad', source]],
        args: arglist,
        outputPaths: [config.output_filename],
        zipArchives: [model_dir],  // just a list of zip files (no longer an object)
    });

    return {
        kill: () => job.kill(),
        completion: (async () => {
            try {
                const result = await job;
                // console.log(result);
                processMergedOutputs(result.mergedOutputs, timestamp);

                if (result.error) {
                    throw result.error;
                }

                metaElement.innerText = ' - Rendered in ' + formatMillis(result.elapsedMillis);
                pageTitle.innerText= 'Gridfinity Generator'
                const [output] = result.outputs;
                if (!output) throw 'No output from runner!'
                const [filePath, content] = output;
                const filePathFragments = filePath.split('/');
                const fileName = filePathFragments[filePathFragments.length - 1];

                // TODO: have the runner accept and return files.
                const blob = new Blob([content], { type: "application/octet-stream" });
                stlFile = new File([blob], fileName);

                viewStlFile(stlFile);

                linkContainerElement.innerHTML = '';
                addDownloadLink(linkContainerElement, blob, fileName);
            } catch (e) {
                console.error(e, e.stack);
                metaElement.innerText = '<failed>';
                metaElement.title = e.toString();
            } finally {
                setExecuting(false);
                renderButton.disabled = false;
            }
        })()
    }
});

renderButton.onclick = () => render({ now: true });

var autorotate = true;

function getState() {
    const features = Object.keys(featureCheckboxes).filter(f => featureCheckboxes[f].checked);
    return {
        source: {
            name: sourceFileName,
            content: 'include <' + model_path + '>',
        },
        autorotate: autorotateCheckbox.checked,
        features,
        viewerFocused: isViewerFocused(),
        camera: persistCameraState ? stlViewer.get_camera_state() : null,
    };
}

function normalizeSource(src) {
    return src.replaceAll(/\/\*.*?\*\/|\/\/.*?$/gm, '')
        .replaceAll(/([,.({])\s+/gm, '$1')
        .replaceAll(/\s+([,.({])/gm, '$1')
        .replaceAll(/\s+/gm, ' ')
        .trim()
}
function normalizeStateForCompilation(state) {
    return {
        ...state,
        source: {
            ...state.source,
            content: normalizeSource(state.source.content)
        },
    }
}

const defaultState = {
    source: {
        name: 'input.stl',
        content: 'include <' + model_path + '>',
    },
    maximumMegabytes: 1024,
    viewerFocused: false,
    features: ['fast-csg', 'fast-csg-trust-corefinement', 'fast-csg-remesh', 'fast-csg-exact-callbacks', 'lazy-union'],
};

function setState(state) {
    sourceFileName = state.source.name || 'input.scad';
    if (state.camera && persistCameraState) {
        stlViewer.set_camera_state(state.camera);
    }
    let features = new Set();
    if (state.features) {
        features = new Set(state.features);
        Object.keys(featureCheckboxes).forEach(f => featureCheckboxes[f].checked = features.has(f));
    }
    setAutoRotate(state.autorotate ?? true)
}

var previousNormalizedState;
function onStateChanged({ allowRun }) {
    const newState = getState();

    featuresContainer.style.display = 'none';

    const normalizedState = normalizeStateForCompilation(newState);
    if (JSON.stringify(previousNormalizedState) != JSON.stringify(normalizedState)) {
        previousNormalizedState = normalizedState;

        if (allowRun) {
            render({ now: false });
        }
    }
}

function pollCameraChanges() {
    if (!persistCameraState) {
        return;
    }
    let lastCam;
    setInterval(function () {
        const ser = JSON.stringify(stlViewer.get_camera_state());
        if (ser != lastCam) {
            lastCam = ser;
            onStateChanged({ allowRun: false });
        }
    }, 1000); // TODO only if active tab
}

async function fetchModelZip(url) {
	    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.arrayBuffer();  // Returns the binary data for further processing
}

async function extractOpenSCADFile(arrayBuffer) {
    const zip = await JSZip.loadAsync(arrayBuffer);
    // Assuming there's only one OpenSCAD file or its name is known
    const scadFile = zip.file("model.scad")
    if (!scadFile) {
        throw new Error("OpenSCAD file not found in the ZIP archive.");
    }
    return scadFile.async("string") ; // Extract file as a string
}
		

function parseOpenSCADConfVariables(content) {
	  const model_parameters_raw = content.split("[Hidden]")[0];
	  console.log(model_parameters_raw);

	  // Split the input text into lines
    const lines = model_parameters_raw.split("\n");
    
    // Initialize the two objects to hold the parameters
    const model_parameter_defaults = {};
    const model_parameter_descriptions = {};

    // Use a regex to match the parameter and value lines
    const paramRegex = /(\w+)\s*=\s*([0-9.]+)\s*;/;  // Matches: PARAM_NAME = value;

    // Iterate through the lines to extract parameters and their descriptions
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if the line is a comment (description)
        if (line.startsWith("//")) {
            const description = line.replace("//", "").trim();  // Remove '//' and trim spaces

            // Look ahead to see if the next line contains a parameter definition
            const nextLine = lines[i + 1] ? lines[i + 1].trim() : "";
            const match = nextLine.match(paramRegex);

            if (match) {
                const paramName = match[1];  // Extract parameter name
                const paramValue = parseFloat(match[2]);  // Extract and convert the value to a number

                // Add the parameter and its value to the _defaults object
                model_parameter_defaults[paramName] = paramValue;

                // Add the parameter and its description to the description object
                model_parameter_descriptions[paramName] = description;

                // Skip the next line since we already processed it
                i++;
            }
        }
    }
    return { model_parameter_defaults, model_parameter_descriptions };
}

async function processOpenSCADFromZip(url) {
    try {
        const arrayBuffer = await fetchModelZip(url);
        const openSCADContent = await extractOpenSCADFile(arrayBuffer);
        const parameters = parseOpenSCADConfVariables(openSCADContent);
			  return parameters;
    } catch (error) {
        console.error("Error processing OpenSCAD file:", error);
    }
}

async function createInputNodes() {
  const container = document.getElementById("param-container"); // Assuming there's a container div in index.html

  const {model_parameter_defaults, model_parameter_descriptions} = await processOpenSCADFromZip(config.zip_archive);

  Object.keys(model_parameter_defaults).forEach(param => {
    const value = model_parameter_defaults[param];
    const description = model_parameter_descriptions[param];

    // Create a div to hold the input node
    const div = document.createElement("div");
    div.classList.add("cell", "param-item-moi");

    // Create the label element
    const label = document.createElement("label");
    label.setAttribute("for", param);
    
    const tooltip = document.createElement("span");
    tooltip.setAttribute("aria-label", description);
    tooltip.classList.add("cooltipz--down", "cooltipz--large");
    tooltip.textContent = "ⓘ";
    
    label.appendChild(tooltip);
    label.appendChild(document.createTextNode(`${param}: `));

    // Create the input element based on the type of value
    let input;
    if (typeof value === "boolean") {
      // Boolean: create checkbox input
      input = document.createElement("input");
      input.id = param;
      input.classList.add("checkmark", "form-control");
      input.type = "checkbox";
      input.checked = value; // Set the checkbox based on the boolean value
    } else if (typeof value === "number") {
      // Float/Number: create number input
      input = document.createElement("input");
      input.id = param;
      input.type = "number";
      input.classList.add("form-control");
      input.value = value; // Set the value of the input to the number
    }

    // Append label and input to the div
    div.appendChild(label);
    div.appendChild(input);

    // Append the div to the container
    container.appendChild(div);
  });
}


try {
    createInputNodes();
    stlViewer = buildStlViewer();
    stlViewerElement.ondblclick = () => {
        setAutoRotate(!autorotateCheckbox.checked);
        onStateChanged({ allowRun: false });
    };

    stlViewerElement.onclick = () => {
        if(settingsVis){ SettingsMenuToggle();};
        if(renderinfoVis){ renderInfoToggle();};
    }

    const initialState = defaultState;

    setState(initialState);
    await buildFeatureCheckboxes(featuresContainer, featureCheckboxes, () => {
        onStateChanged({ allowRun: true });
    });
    setState(initialState);

    autorotateCheckbox.onchange = () => {
        stlViewer.set_auto_rotate(autorotateCheckbox.checked);
        onStateChanged({ allowRun: false });
    };


    resetDefaults.onclick = () => {
        paramSetDefaults();
    }
    pollCameraChanges();
    onStateChanged({ allowRun: true });


} catch (e) {
    console.error(e);
}
