import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OutlinePass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/OutputPass.js';

let langFile = {};

let examples = [
    {
        "name": "Industrial Turbine",
        "id": "industrial_turbine_5x5x9",
        "amount": 2
    },
    {
        "name": "Fusion Reactor",
        "id": "fusion_reactor"
    },
    {
        "name": "Supercritical Shifter",
        "id": "supercritical_phase_shifter"
    },
    {
        "name": "Thermal Plant",
        "id": "thermal_evaporation_plant_4x4x3"
    },
    {
        "name": "Thermoelectric Boiler",
        "id": "thermoelectric_boiler"
    }
]

// Add examples to examples window
examples.forEach(function(example) {
    let currentExample = document.createElement("example");
    currentExample.textContent = example.name;
    currentExample.onclick = function() {
        document.querySelector('#fileExamples').style.opacity = 0;
        document.querySelector('#fileExamples').style.display = "none";
        loadExample(example.id);
    };
    document.getElementById('fileExampleList').appendChild(currentExample);
});

// Get english lang file
fetch('lang/en.lang')
    .then(response => response.text())
    .then(data => {
        langFile["en"] = data.replaceAll(/^\/\/.*$/gm, '');
    })
    .catch(error => {
        console.error('Error loading the file:', error);
    });

// Get lang
function getLang(key, lang = "en") {
    const index = langFile[lang].indexOf(key + "=");
    if (index !== -1) {
        // Find the index of the next newline after the key=value
        const nextLineIndex = langFile[lang].indexOf("\n", index);
        if (nextLineIndex !== -1) {
            // Return everything after the key= and up until the next newline
            return langFile[lang].slice(index + key.length + 1, nextLineIndex).trim();
        } else {
            // If no newline exists after the key, return everything from the key to the end of the string
            return langFile[lang].slice(index + key.length + 1).trim();
        }
    }
    return key; // Return the key if not found
}

// Handle dropping files
    var dropZone = document.getElementById('dropzone');

    function showDropZone() {
    	dropZone.style.display = "block";
    	dropZone.style.opacity = 1;
        document.getElementById('manualFileInput').style.color = "#555555"
    }
    function hideDropZone() {
    	dropZone.style.opacity = 0;
        document.getElementById('manualFileInput').style.color = "#AAAAAA"
        setTimeout(function(){
            dropZone.style.display = "none";
        }, 3000);
    }

    function allowDrag(e) {
        if (true) {  // Test that the item being dragged is a valid one
            e.dataTransfer.dropEffect = 'copy';
            e.preventDefault();
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        hideDropZone();
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            const file = files[0];
            handleFile(file)
        } else {
            alert("No file detected!");
        }
    }

    // 1
    window.addEventListener('dragenter', function(e) {
        showDropZone();
    });

    // 2
    dropZone.addEventListener('dragenter', allowDrag);
    dropZone.addEventListener('dragover', allowDrag);

    // 3
    dropZone.addEventListener('dragleave', function(e) {
        hideDropZone();
    });

    // 4
    dropZone.addEventListener('drop', handleDrop);

// Check file existence
function fileExistence(filePath, callback) {
    try {
        var http = new XMLHttpRequest();
        http.open('HEAD', filePath, true);

        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                try {
                    callback(http.status === 200);
                } catch (e) {
                    callback(false);
                }
            }
        };

        http.onerror = function () {
            try {
                callback(false);
            } catch (e) {}
        };

        http.send();
    } catch (e) {
        callback(false);
    }
}

const scene = new THREE.Scene();
const blockDisplay = new THREE.Scene();
// Create Orthographic Camera
const aspectRatio = window.innerWidth / window.innerHeight;
const blockDisplayRatio = 1;
const frustumSize = 10; // Adjust to zoom in or out
const blockDisplayFrustumSize = 2; // Adjust to zoom in or out
const camera = new THREE.OrthographicCamera(
    -frustumSize * aspectRatio / 2,  // Left
    frustumSize * aspectRatio / 2,   // Right
    frustumSize / 2,                 // Top
    -frustumSize / 2,                // Bottom
    1,                               // Near
    500                              // Far
);
const blockDisplayCamera = new THREE.OrthographicCamera(
    -blockDisplayFrustumSize * blockDisplayRatio / 2,  // Left
    blockDisplayFrustumSize * blockDisplayRatio / 2,   // Right
    blockDisplayFrustumSize / 2,                 // Top
    -blockDisplayFrustumSize / 2,                // Bottom
    1,                               // Near
    500                              // Far
);
camera.position.set(10, 10, 10); // Start at an angle
camera.lookAt(0, 0, 0); // Look at the center
blockDisplayCamera.position.set(5, 5, 5); // Start at an angle
blockDisplayCamera.lookAt(0, 0, 0); // Look at the center

const light = new THREE.AmbientLight(0xffffff, 2);
scene.add(light);
const blockDisplayLight = new THREE.AmbientLight(0xffffff, 1);
blockDisplayLight.position.set(10, 10, 10); // Start at an angle
blockDisplay.add(blockDisplayLight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer( {antialias: true} );
renderer.setClearColor(0x080808, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild( renderer.domElement );

const blockDisplayRenderer = new THREE.WebGLRenderer( {canvas: document.getElementById("blockDisplayCanvas"), antialias: true} );
blockDisplayRenderer.setClearColor(0xFFFFFF, 0);
blockDisplayRenderer.setSize( 100, 100 );

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.selectedObjects = []; // objects to outline
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#424242');
// outlinePass.edgeStrength = 2;
// outlinePass.edgeGlow = 0;
// outlinePass.edgeThickness = 1;
// outlinePass.pulsePeriod = 0;
composer.addPass(outlinePass);
composer.addPass(new OutputPass);

// Store blocks for raycasting
let savedBlocks = [];

function getPathSelfVersion(path, type="textures", variiation="model") {
    switch (type) {
        case "textures":
            return "textures/" + path + ".png";
        case "models":
            if (variiation == "model") {
                return "models/" + path + ".json";
            } else {
                return "models/" + path + ".gltf";
            }
        case "states":
            return "blockstates/" + path + ".json";
    }
}

function getPath(textureId, type="textures") {
    switch (type) {
        case "textures":
            return "textures/" + path + ".png";
        case "models":
            return "models/" + path + ".json";
        case "states":
            return "blockstates/" + path + ".json";
    }
}

document.getElementById("seeExamples").addEventListener('click', function(event) {
    document.getElementById("fileExamples").style.display = "flex";
    setTimeout(function() {
        document.getElementById("fileExamples").style.opacity = 1;
    }, 10)
})

document.getElementById("fileExampleClose").addEventListener('click', function(event) {
    document.querySelector('#fileExamples').style.opacity = 0;
    setTimeout(function(){
        document.querySelector('#fileExamples').style.display = "none";
    }, 500);
})

document.getElementById("modManagementClose").addEventListener('click', function(event) {
    document.querySelector('#modManagement').style.opacity = 0;
    setTimeout(function(){
        document.querySelector('#modManagement').style.display = "none";
    }, 500);
})

function getNbt(object, name) {
    switch(name) {
        case "mekanismgenerators":
            return {"mode": object.state};
    }
}
function calculateRotation(angle) {
    return (Math.PI / 180) * angle;
}

function addBlockToScene(block, palette) {

}

function addBlockToSceneSelfVersion(element, palette) {
    let fullName = element.namespace + ":" + element.id;
    let blockPalette = {};
    if (palette[element.state] != undefined) {
        blockPalette = palette[element.state];
    }
    if (fullName != "minecraft:air") {
        const filePath = element.namespace + "/" + element.id;
        fileExistence(getPathSelfVersion(filePath, "states"), function(stateExists) {
            if (stateExists) {
                fetch(getPathSelfVersion(filePath, "states"))
                .then(response => response.text())
                .then(data => {
                    Object.entries(JSON.parse(data)).forEach(([key, value]) => {
                        if (key != "default") {
                            if (blockPalette[key.split("=")[0]] != undefined) {
                                let acceptedParams = true;
                                key.split(",").forEach((param) => {
                                    if (param.split("=")[1] != blockPalette[param.split("=")[0]]) {
                                        acceptedParams = false;
                                    }
                                });
                                if (acceptedParams) {
                                    switch(value.type) {
                                        case "texture":
                                            fileExistence(getPathSelfVersion(value.src, "textures"), function(textureExists) {
                                                const texture = new THREE.TextureLoader().load(textureExists ? getPathSelfVersion(value.src, "textures") : "textures/minecraft/missing.png");
                                                texture.magFilter = THREE.NearestFilter;
                                                texture.minFilter = THREE.NearestFilter;
                                                texture.generateMipmaps = false;
                                                texture.wrapS = THREE.RepeatWrapping;
                                                texture.wrapT = THREE.RepeatWrapping;
                                                texture.repeat.set(1, 1);
                                                texture.colorSpace = "srgb";
                                            
                                                const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
                                                const geometry = new THREE.BoxGeometry(1, 1, 1);
                                                const cube = new THREE.Mesh(geometry, material);
                                            
                                                // Store the namespace and id on the cube as user data
                                                cube.objectData = {
                                                    namespace: element.namespace,
                                                    id: element.id,
                                                    isFullBlock: true
                                                };
                                            
                                                cube.position.set(element.position[0], element.position[1], element.position[2]);
                                                scene.add(cube);
                                            
                                                // Add the cube to the blocks array for raycasting
                                                savedBlocks.push(cube);
                                            });
                                            break;
                                        case "model":
                                            fileExistence(getPathSelfVersion(value.src, "models"), function(modelExists) {
                                                if (modelExists) {
                                                    fetch(getPathSelfVersion(value.src, "models"))
                                                    .then(response => response.text())
                                                    .then(data => {
                                                        let sides = {}
                                                        const configSides = [
                                                            "x+", "x-",
                                                            "y+", "y-",
                                                            "z+", "z-"
                                                        ]
                                                        Object.entries(JSON.parse(data)).forEach(([key, value]) => {
                                                            switch(key) {
                                                                case "all":
                                                                    sides["x+"] = value;
                                                                    sides["x-"] = value;
                                                                    sides["y+"] = value;
                                                                    sides["y-"] = value;
                                                                    sides["z+"] = value;
                                                                    sides["z-"] = value;
                                                                    break;
                                                                case "end":
                                                                    sides["y+"] = value;
                                                                    sides["y-"] = value;
                                                                    break;
                                                                case "side":
                                                                    sides["x+"] = value;
                                                                    sides["x-"] = value;
                                                                    sides["z+"] = value;
                                                                    sides["z-"] = value;
                                                                    break;
                                                                case "top":
                                                                    sides["y+"] = value;
                                                                    break;
                                                                case "bottom":
                                                                    sides["y-"] = value;
                                                                    break;
                                                                case "back":
                                                                    sides["z+"] = value;
                                                                    break;
                                                                case "front":
                                                                    sides["z-"] = value;
                                                                    break;
                                                                case "left":
                                                                    sides["x+"] = value;
                                                                    break;
                                                                case "right":
                                                                    sides["x-"] = value;
                                                                    break;
                                                            }
                                                        });
                                                        configSides.forEach(function(currentSide) {
                                                            if (!sides[currentSide]) {
                                                                sides[currentSide] = "minecraft:missing";
                                                            } else {
                                                                fileExistence(getPathSelfVersion(
                                                                    sides[currentSide].split(":")[0] + "/" + sides[currentSide].split(":")[1],"textures"), function(currentSideExists) {
                                                                    if (!currentSideExists) {
                                                                        sides[currentSide] = "minecraft:missing";
                                                                    }
                                                                });
                                                            }
                                                        });
                                                        let materialsSides = {};
                                                        Object.entries(sides).forEach(([key, value]) => {
                                                            const sideTexture = new THREE.TextureLoader().load(getPathSelfVersion(
                                                                sides[key].split(":")[0] + "/" + sides[key].split(":")[1],
                                                                "textures"));
                                                            sideTexture.magFilter = THREE.NearestFilter;
                                                            sideTexture.minFilter = THREE.NearestFilter;
                                                            sideTexture.generateMipmaps = false;
                                                            sideTexture.wrapS = THREE.RepeatWrapping;
                                                            sideTexture.wrapT = THREE.RepeatWrapping;
                                                            sideTexture.repeat.set(1, 1);
                                                            sideTexture.colorSpace = "srgb";
                                                            
                                                            materialsSides[key] = new THREE.MeshStandardMaterial({ map: sideTexture, transparent: true });
                                                        });
                                                        let materials = [
                                                            materialsSides["x+"],
                                                            materialsSides["x-"],
                                                            materialsSides["y+"],
                                                            materialsSides["y-"],
                                                            materialsSides["z+"],
                                                            materialsSides["z-"]
                                                        ];
                                                        const geometry = new THREE.BoxGeometry(1, 1, 1);
                                                        const cube = new THREE.Mesh(geometry, materials);
                        
                                                        cube.objectData = {
                                                            namespace: element.namespace,
                                                            id: element.id,
                                                            isFullBlock: true
                                                        };
                                                    
                                                        cube.position.set(element.position[0], element.position[1], element.position[2]);
                                                        if (value.y != undefined) {
                                                            cube.rotation.y = calculateRotation(value.y);
                                                        }
                                                        if (value.x != undefined) {
                                                            cube.rotation.xy = calculateRotation(value.x);
                                                        }
                                                        if (value.z != undefined) {
                                                            cube.rotation.xy = calculateRotation(value.z);
                                                        }
                                                        scene.add(cube);
                                                    
                                                        savedBlocks.push(cube);
                                                    })
                                                    .catch(error => {
                                                        console.error('Error loading the model:', error);
                                                    });
                                                }
                                            });
                                            break;
                                        case "gltf":
                                            fileExistence(getPathSelfVersion(filePath, "models", "gltf"), function(gltfModelExists) {
                                                if (gltfModelExists) {
                                                    const loader = new GLTFLoader();
                                                    loader.load(getPathSelfVersion(filePath, "models", "gltf"), function (gltf) {
                
                                                        gltf.scene.objectData = {
                                                            namespace: element.namespace,
                                                            id: element.id,
                                                            isFullBlock: false
                                                        };
                                                        gltf.scene.position.set(element.position[0] - 0.5,
                                                            element.position[1] - 0.5,
                                                            element.position[2] - 0.5);
                                                        if (value.y != undefined) {
                                                            gltf.scene.rotation.y = calculateRotation(value.y);
                                                        }
                                                        if (value.x != undefined) {
                                                            gltf.scene.rotation.xy = calculateRotation(value.x);
                                                        }
                                                        if (value.z != undefined) {
                                                            gltf.scene.rotation.xy = calculateRotation(value.z);
                                                        }
                                                        scene.add(gltf.scene);
                                                        savedBlocks.push(gltf.scene);
                                                    }, undefined, function ( error ) {
                                                        console.error( error );
                                                    });
                                                }
                                            });
                                            break;
                                    }
                                }
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error('Error loading the blockstate:', error);
                });
            } else {
                fileExistence(getPathSelfVersion(filePath, "models"), function(modelExists) {
                    if (modelExists) {
                        fetch(getPathSelfVersion(filePath, "models"))
                        .then(response => response.text())
                        .then(data => {
                            let sides = {}
                            const configSides = [
                                "x+", "x-",
                                "y+", "y-",
                                "z+", "z-"
                            ]
                            Object.entries(JSON.parse(data)).forEach(([key, value]) => {
                                let sidesToAdd = [];
                                switch(key) {
                                    case "all":
                                        sidesToAdd.push("x+", "x-", "y+", "y-", "z+", "z-");
                                        break;
                                    case "end":
                                        sidesToAdd.push("y+", "y-");
                                        break;
                                    case "side":
                                        sidesToAdd.push("x+", "x-", "z+", "z-");
                                        break;
                                    case "top":
                                        sidesToAdd.push("y+");
                                        break;
                                    case "bottom":
                                        sidesToAdd.push("y-");
                                        break;
                                    case "back":
                                        sidesToAdd.push("z+");
                                        break;
                                    case "front":
                                        sidesToAdd.push("z-");
                                        break;
                                    case "left":
                                        sidesToAdd.push("x+");
                                        break;
                                    case "right":
                                        sidesToAdd.push("x-");
                                        break;
                                }
                                sidesToAdd.forEach(side => {
                                    sides[side] = value;
                                });
                            });
                            configSides.forEach(function(currentSide) {
                                if (!sides[currentSide]) {
                                    sides[currentSide] = "minecraft:missing";
                                } else {
                                    fileExistence(getPathSelfVersion(
                                        sides[currentSide].split(":")[0] + "/" + sides[currentSide].split(":")[1],"textures"), function(currentSideExists) {
                                        if (!currentSideExists) {
                                            sides[currentSide] = "minecraft:missing";
                                        }
                                    });
                                }
                            });
                            let materialsSides = {};
                            Object.entries(sides).forEach(([key, value]) => {
                                const sideTexture = new THREE.TextureLoader().load(getPathSelfVersion(
                                    sides[key].split(":")[0] + "/" + sides[key].split(":")[1],
                                    "textures"));
                                sideTexture.magFilter = THREE.NearestFilter;
                                sideTexture.minFilter = THREE.NearestFilter;
                                sideTexture.generateMipmaps = false;
                                sideTexture.wrapS = THREE.RepeatWrapping;
                                sideTexture.wrapT = THREE.RepeatWrapping;
                                sideTexture.repeat.set(1, 1);
                                sideTexture.colorSpace = "srgb";
                                
                                materialsSides[key] = new THREE.MeshStandardMaterial({ map: sideTexture, transparent: true });
                            });
                            let materials = [
                                materialsSides["x+"],
                                materialsSides["x-"],
                                materialsSides["y+"],
                                materialsSides["y-"],
                                materialsSides["z+"],
                                materialsSides["z-"]
                            ];
                            const geometry = new THREE.BoxGeometry(1, 1, 1);
                            const cube = new THREE.Mesh(geometry, materials);

                            cube.objectData = {
                                namespace: element.namespace,
                                id: element.id,
                                isFullBlock: true
                            };
                        
                            cube.position.set(element.position[0], element.position[1], element.position[2]);
                            scene.add(cube);
                        
                            savedBlocks.push(cube);
                        })
                        .catch(error => {
                            console.error('Error loading the model:', error);
                        });
                    } else {
                        fileExistence(getPathSelfVersion(filePath, "models", "gltf"), function(gltfModelExists) {
                            if (gltfModelExists) {
                                const loader = new GLTFLoader();
                                loader.load(getPathSelfVersion(filePath, "models", "gltf"), function (gltf) {

                                    gltf.scene.objectData = {
                                        namespace: element.namespace,
                                        id: element.id,
                                        isFullBlock: false
                                    };
                                    gltf.scene.position.set(element.position[0] - 0.5,
                                        element.position[1] - 0.5,
                                        element.position[2] - 0.5);
                                    scene.add(gltf.scene);
                                    savedBlocks.push(gltf.scene);
                                }, undefined, function ( error ) {
                                    console.error( error );
                                });
                            } else {
                                fileExistence(getPathSelfVersion(filePath, "textures"), function(textureExists) {
                                    const texture = new THREE.TextureLoader().load(textureExists ? getPathSelfVersion(filePath, "textures") : "textures/minecraft/missing.png");
                                    texture.magFilter = THREE.NearestFilter;
                                    texture.minFilter = THREE.NearestFilter;
                                    texture.generateMipmaps = false;
                                    texture.wrapS = THREE.RepeatWrapping;
                                    texture.wrapT = THREE.RepeatWrapping;
                                    texture.repeat.set(1, 1);
                                    texture.colorSpace = "srgb";
                                
                                    const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
                                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                                    const cube = new THREE.Mesh(geometry, material);
                                
                                    // Store the namespace and id on the cube as user data
                                    cube.objectData = {
                                        namespace: element.namespace,
                                        id: element.id,
                                        isFullBlock: true
                                    };
                                
                                    cube.position.set(element.position[0], element.position[1], element.position[2]);
                                    scene.add(cube);
                                
                                    // Add the cube to the blocks array for raycasting
                                    savedBlocks.push(cube);
                                });
                            }
                        });
                    }
                });
            }
        });
    }
}

function constructScene(blocksData, palette) {
    blocksData.forEach(function(element) {
        addBlockToSceneSelfVersion(element, palette)
    });
}

function addModFiles(file) {
    document.getElementById("modManagement").style.display = "flex";
    setTimeout(function() {
        document.getElementById("modManagement").style.opacity = 1;
    }, 10)
    let currentModElement = document.createElement("mod");
    currentModElement.textContent = file.name;
    document.getElementById('modList').appendChild(currentModElement);
    
    try {
        output = new pako.inflate(file);
    } catch  (err) {
        console.log(err);  // unknown compression method
    }
}

function handleFile(file) {
    document.querySelector('#fileUpload').style.opacity = 0;
    document.querySelector('#fileExamples').style.opacity = 0;
    setTimeout(function(){
        document.querySelector('#fileUpload').style.display = "none";
        document.querySelector('#fileExamples').style.display = "none";
    }, 3000);
    savedBlocks.forEach(function(obj) {
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            obj.material.dispose();
        }
        scene.remove(obj);
    });
    if (!file) return;

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function() {
        let buffer = new Uint8Array(reader.result);

        try {
            // Check if the NBT file is compressed (gzip header: 0x1F 0x8B)
            if (buffer[0] === 0x1F && buffer[1] === 0x8B) {
                buffer = pako.ungzip(buffer); // Decompress using pako
            }

            nbt.parse(buffer, function(error, data) {
                if (error) {
                    console.error("Error parsing NBT file: " + error.message);
                    return;
                }
                console.log(JSON.stringify(data, null, 2))
                console.log(data)
                let palette = [];
                data.value.palette.value.value.forEach(function(element) {
                    let currentPalette = {};
                    currentPalette["name"] = element.Name.value;
                    if (element.Properties != undefined) {
                        Object.keys(element.Properties.value).forEach(function(nbtElement) {
                            currentPalette[nbtElement] = element.Properties.value[nbtElement].value;
                        });
                    }
                    palette.push(currentPalette);
                });
                console.log(palette)
                let blocks = [];
                data.value.blocks.value.value.forEach(function(element) {
                    if (element.nbt != undefined) {
                        const block = {
                            namespace: element.nbt.value.id.value.split(":")[0],
                            id: element.nbt.value.id.value.split(":")[1],
                            position: element.pos.value.value,
                            state: element.state.value
                        }
                        blocks.push(block)
                    } else {
                        if (element.state.value != undefined) {
                            const block = {
                                namespace: palette[element.state.value]["name"].split(":")[0],
                                id: palette[element.state.value]["name"].split(":")[1],
                                position: element.pos.value.value,
                                state: element.state.value
                            }
                            blocks.push(block)
                        } else {
                            const block = {
                                namespace: "minecraft",
                                id: "air",
                                position: element.pos.value.value
                            }
                            blocks.push(block)
                        }
                    }
                });

                // Extract size (assuming it's stored in the root compound)
                const size = data.value.size.value.value;
                const xyz = [size[0], size[1], size[2]]; // ZYX order

                // Extract blocks (assuming it's stored under 'blocks')
                // const blocks = data.value.blocks.value;
                const center = [(xyz[0] / 2) - 0.5, (xyz[1] / 2) - 0.5, (xyz[2] / 2) - 0.5]

                if ( WebGL.isWebGL2Available() ) {
                    constructScene(blocks, palette)
                    console.log(center)
                    renderer.setAnimationLoop(() => animate(center));
                    blockDisplayRenderer.setAnimationLoop(blockDisplayAnimation);
                } else {
                    const warning = WebGL.getWebGL2ErrorMessage();
                    document.getElementById( 'container' ).appendChild( warning );
                }                
            });
        } catch (err) {
            console.error("Error parsing NBT file: " + err.message);
        }
    };
}

function getObjectData(object) {
    while (object && !object.objectData) {
        object = object.parent; // Move up the hierarchy
    }
    return object ? object : null; // Return found data or null if none exists
}
const raycaster = new THREE.Raycaster();

let currentSelection;
let currentSelectionClone;

document.addEventListener('mousedown', (event) => {
    if (((event.target.id === 'tooltip' || event.target.closest("#tooltip") != null)
        && window.getComputedStyle(document.querySelector('#tooltip')).opacity == 0.9) || event.target.id === 'seeExamples') {
        return; // Skip the rest of the logic if clicking on #tooltip
    }
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -((event.clientY / renderer.domElement.clientHeight) * 2 - 1)
    );
    raycaster.setFromCamera(coords, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (currentSelectionClone) {
        blockDisplay.remove(currentSelectionClone)
    }

    if (intersects.length > 0) {
        // Get the first intersected object
        const object = intersects[0].object;
        
        // Access the namespace and id from the object
        const objectCube = getObjectData(object);
        let objectData = {};
        if (objectCube) {
            objectData.namespace = objectCube.objectData.namespace;
            objectData.id = objectCube.objectData.id;
            objectData.isFullBlock = objectCube.objectData.isFullBlock;
            if (objectData.isFullBlock) {
                objectData.position = objectCube.position;
            } else {
                objectData.position = object.parent.parent.position
            }
        } else {
            console.error("No object data found.");
        }
        currentSelection = object;
        let objectPos = [];
        if (!objectData.isFullBlock) {
            objectPos.push((objectData.position.x + 0.5));
            objectPos.push((objectData.position.y + 0.5));
            objectPos.push((objectData.position.z + 0.5));
        } else {
            objectPos = objectCube.position.toArray();
        }
        if (getLang(objectData.namespace + "." + objectData.id)
            == objectData.namespace + "." + objectData.id) {
            document.querySelector('#tooltip #block').innerHTML = objectData.namespace + ":" + objectData.id;
            document.querySelector('#tooltip #namespacesay').innerHTML = "";
            document.querySelector('#tooltip #namespace').innerHTML = "";
        } else {
            document.querySelector('#tooltip #block').innerHTML = getLang(objectData.id);
            if (objectData.namespace == "minecraft") {
                document.querySelector('#tooltip #namespacesay').innerHTML = "";
                document.querySelector('#tooltip #namespace').innerHTML = "";
            } else {
                document.querySelector('#tooltip #namespacesay').innerHTML = "in";
                document.querySelector('#tooltip #namespace').innerHTML = getLang(objectData.namespace);
            }
        }
        document.querySelector('#tooltip #position').innerHTML = objectPos.join(", ");
        document.querySelector('#tooltip').style.opacity = 0.9;
        currentSelectionClone = object.clone();
        currentSelectionClone.position.set(2, 2, 2);
        currentSelectionClone.rotation.y = calculateRotation(270)
        blockDisplay.add(currentSelectionClone);
        outlinePass.selectedObjects = [object]
        // scene.remove(object)
    } else {
        document.querySelector('#tooltip').style.opacity = 0;
        outlinePass.selectedObjects = []
    }
});

document.querySelector('#tooltip #deletion').addEventListener('click', function(event) {
    outlinePass.selectedObjects = [];
    if (void 0 !== currentSelection) {
        scene.remove(currentSelection);
        blockDisplay.remove(currentSelectionClone);
    }
    document.querySelector('#tooltip').style.opacity = 0;
    currentSelection = undefined;
    currentSelectionClone = undefined;
});
document.getElementById('fileInput').addEventListener('change', function(event) {
    console.log(event.target.files[0]);
    handleFile(event.target.files[0]);
});

document.getElementById('modInput').addEventListener('change', function(event) {
    addModFiles(event.target.files[0]);
});

function loadExample(example) {
    // fileExistence('examples/' + example + ".nbt", function(exampleExists) {
    //     console.log(exampleExists ? "Yeas" : "nooo")
    // })
    fetch('examples/' + example + ".nbt")
        .then(response => response.blob()) // Get as a Blob
        .then(blob => {
            let file = new File([blob], example + ".nbt", { type: "application/octet-stream" });
            handleFile(file); // Now consistent with input file handling
        })
        .catch(error => {
            console.error('Error loading the file by example:', error);
        });
    
}

let moveSpeed = 0.05; // Adjust the speed of movement
let modMoveSpeed = 0.15;


let angle = 45 * Math.PI / 180;
let rotate = false;
let height = 20 * Math.PI / 180;

let angleSpeed = 0;
let lastEditedByFinger = false;

// Listen for arrow key events to move the camera up and down
const keys = new Set();

document.addEventListener('keydown', (e) => {
    keys.add(e.key);
});

document.addEventListener('keyup', (e) => {
    keys.delete(e.key);
});
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowUp") {
        height = Math.max(Math.PI / -2 + 0.001, Math.min(height + moveSpeed, Math.PI / 2 - 0.001));
    } else if (event.key === "ArrowDown") {
        height = Math.max(Math.PI / -2 + 0.001, Math.min(height - moveSpeed, Math.PI / 2 - 0.001));
    }
});

const pointers = new Map();

document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;

    pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
    });
    
    angleSpeed = 0;
    lastEditedByFinger = true;

    document.setPointerCapture(e.pointerId);
});

document.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;

    const p = pointers.get(e.pointerId);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    // -- old --
    // y\cdot a<\left(\operatorname{abs}\left(x\right)\right)\left\{y\cdot a>-\operatorname{abs}\left(x\right)\right\}
    // y*a<(abs(x)){y*a>-abs(x)}
    // -- new --
    // \operatorname{abs}\left(x\right)\cdot a<\operatorname{abs}\left(y\right)
    // abs(x)*a<abs(y)
    // -- new new --
    // \operatorname{abs}\left(x\right)\cdot a<\left(\operatorname{abs}\left(y\right)\right)\left\{\operatorname{abs}\left(y\right)>b\right\}
    // abs(x)*a<(abs(y)){abs(y)>b}
    if (Math.abs(dx)*0.4 < Math.abs(dy)) {
        height = Math.max(Math.PI / -2 + 0.001, Math.min(height + (dy/100), Math.PI / 2 - 0.001));
    }

    if (Math.abs(dy)*0.4 < Math.abs(dx)) {
        angleSpeed = dx/100;
    }
    lastEditedByFinger = true;

    p.x = e.clientX;
    p.y = e.clientY;

    // handled later
});

document.addEventListener('pointerup', release);
document.addEventListener('pointercancel', release);

function release(e) {
    pointers.delete(e.pointerId);
    document.releasePointerCapture(e.pointerId);
}


// Animation loop
function blockDisplayAnimation() {
    blockDisplayRenderer.render( blockDisplay, blockDisplayCamera );
}

function animate(center) {
    let currentMoveSpeed = moveSpeed;
    if (keys.has("Control")) {
        currentMoveSpeed = modMoveSpeed;
    }
    if (keys.has("ArrowUp")) {
        height = Math.max(Math.PI / -2 + 0.001, Math.min(height + currentMoveSpeed, Math.PI / 2 - 0.001));
    }
    if (keys.has("ArrowDown")) {
        height = Math.max(Math.PI / -2 + 0.001, Math.min(height - currentMoveSpeed, Math.PI / 2 - 0.001));
    }
    if (keys.has("ArrowLeft")) {
        angle += currentMoveSpeed;
    }
    if (keys.has("ArrowRight")) {
        angle -= currentMoveSpeed;
    }
    if (keys.has("ArrowLeft") || keys.has("ArrowRight")) {
        angleSpeed = 0;
        lastEditedByFinger = false;
    }
    const radius = 10;
    angle += ((rotate && !keys.has("ArrowLeft") && !keys.has("ArrowRight")) ? 0.01 : 0);
    angle += angleSpeed;
    angleSpeed = Math.abs(angleSpeed) > 0.001 && (!lastEditedByFinger || Math.abs(angleSpeed) > 0.1) ? angleSpeed * 0.99: 0;
    lastEditedByFinger = false;
    // camera.position.x = center[0] + Math.cos(angle) * radius;
    camera.position.x = center[0] + Math.cos(angle) * radius * Math.cos(height);
    camera.position.z = center[2] + Math.sin(angle) * radius * Math.cos(height);
    camera.position.y = center[1] + Math.sin(height) * radius;
    camera.lookAt(...center);
    // renderer.render( scene, camera );
    composer.render();
}