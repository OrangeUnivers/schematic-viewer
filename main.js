import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { OutlinePass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/OutlinePass.js';
// import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/RenderPass.js';

let langFile = {};

let examples = [
    {
        "name": "Industrial Turbine",
        "id": "industrial_turbine_5x5x9"
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

examples.forEach(function(example) {
    let currentExample = document.createElement("example");
    currentExample.textContent = example.name;
    currentExample.onclick = function() {
        loadExample(example.id);
    };
    document.getElementById('fileExampleList').appendChild(currentExample);
});

fetch('lang/en.lang')
    .then(response => response.text())
    .then(data => {
        langFile["en"] = data.replaceAll(/^\/\/.*$/gm, '');
    })
    .catch(error => {
        console.error('Error loading the file:', error);
    });

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
const blockDisplayLight = new THREE.AmbientLight(0xffffff, 2);
blockDisplayLight.position.set(10, 10, 10); // Start at an angle
blockDisplay.add(blockDisplayLight);

// Set up the renderer
const renderer = new THREE.WebGLRenderer( {antialias: true} );
renderer.setClearColor(0x222222, 1);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const blockDisplayRenderer = new THREE.WebGLRenderer( {canvas: document.getElementById("blockDisplayCanvas"), antialias: true} );
blockDisplayRenderer.setClearColor(0xFFFFFF, 0);
blockDisplayRenderer.setSize( 100, 100 );

// Store blocks for raycasting
let savedBlocks = [];

function getPath(path, type="textures", variiation="model") {
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

document.getElementById("seeExamples").addEventListener('click', function(event) {
    document.getElementById("fileExamples").style.display = "flex";
    setTimeout(function() {
        document.getElementById("fileExamples").style.opacity = 1;
    }, 100)
})

document.getElementById("fileExampleClose").addEventListener('click', function(event) {
    document.querySelector('#fileExamples').style.opacity = 0;
    setTimeout(function(){
        document.querySelector('#fileExamples').style.display = "none";
    }, 3000);
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


function constructScene(blocksData, palette) {
    blocksData.forEach(function(element) {
        let fullName = element.namespace + ":" + element.id;
        let blockPalette;
        if (palette[element.state] != undefined) {
            blockPalette = palette[element.state];
        } else {
            blockPalette = {};
        }
        if (fullName != "minecraft:air") {
            const filePath = element.namespace + "/" + element.id;
            fileExistence(getPath(filePath, "states"), function(stateExists) {
                if (stateExists) {
                    fetch(getPath(filePath, "states"))
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
                                                fileExistence(getPath(value.src, "textures"), function(textureExists) {
                                                    const texture = new THREE.TextureLoader().load(textureExists ? getPath(value.src, "textures") : "textures/minecraft/missing.png");
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
                                                fileExistence(getPath(value.src, "models"), function(modelExists) {
                                                    if (modelExists) {
                                                        fetch(getPath(value.src, "models"))
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
                                                                    fileExistence(getPath(
                                                                        sides[currentSide].split(":")[0] + "/" + sides[currentSide].split(":")[1],"textures"), function(currentSideExists) {
                                                                        if (!currentSideExists) {
                                                                            sides[currentSide] = "minecraft:missing";
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                            let materialsSides = {};
                                                            Object.entries(sides).forEach(([key, value]) => {
                                                                const sideTexture = new THREE.TextureLoader().load(getPath(
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
                                                fileExistence(getPath(filePath, "models", "gltf"), function(gltfModelExists) {
                                                    if (gltfModelExists) {
                                                        const loader = new GLTFLoader();
                                                        loader.load(getPath(filePath, "models", "gltf"), function (gltf) {
                    
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
                    fileExistence(getPath(filePath, "models"), function(modelExists) {
                        if (modelExists) {
                            fetch(getPath(filePath, "models"))
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
                                        fileExistence(getPath(
                                            sides[currentSide].split(":")[0] + "/" + sides[currentSide].split(":")[1],"textures"), function(currentSideExists) {
                                            if (!currentSideExists) {
                                                sides[currentSide] = "minecraft:missing";
                                            }
                                        });
                                    }
                                });
                                let materialsSides = {};
                                Object.entries(sides).forEach(([key, value]) => {
                                    const sideTexture = new THREE.TextureLoader().load(getPath(
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
                            fileExistence(getPath(filePath, "models", "gltf"), function(gltfModelExists) {
                                if (gltfModelExists) {
                                    const loader = new GLTFLoader();
                                    loader.load(getPath(filePath, "models", "gltf"), function (gltf) {

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
                                    fileExistence(getPath(filePath, "textures"), function(textureExists) {
                                        const texture = new THREE.TextureLoader().load(textureExists ? getPath(filePath, "textures") : "textures/minecraft/missing.png");
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
    });
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
            console.error("No object data found.")
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
        document.querySelector('#tooltip').style.opacity = 0.9;
        document.querySelector('#tooltip').style.opacity = 0.9;
        currentSelectionClone = object.clone();
        currentSelectionClone.position.set(2, 2, 2);
        currentSelectionClone.rotation.y = calculateRotation(270)
        blockDisplay.add(currentSelectionClone);
        // scene.remove(object)
    } else {
        document.querySelector('#tooltip').style.opacity = 0;
    }
});

document.querySelector('#tooltip #deletion').addEventListener('click', function(event) {
    if (currentSelection) {
        scene.remove(currentSelection)
        blockDisplay.remove(currentSelectionClone)
    }
    document.querySelector('#tooltip').style.opacity = 0;
    currentSelection = undefined
    currentSelectionClone = undefined
});
document.getElementById('fileInput').addEventListener('change', function(event) {
    console.log(event.target.files[0])
    handleFile(event.target.files[0])
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

let moveSpeed = 0.5; // Adjust the speed of movement

// Listen for arrow key events to move the camera up and down
document.addEventListener('keydown', function(event) {
    if (event.key === "ArrowUp") {
        camera.position.y += moveSpeed; // Move up
    } else if (event.key === "ArrowDown") {
        camera.position.y -= moveSpeed; // Move down
    }
});


let angle = 0;
let rotate = true;
// Animation loop

function blockDisplayAnimation() {
    blockDisplayRenderer.render( blockDisplay, blockDisplayCamera );
}

function animate(center) {
    const radius = 10;
    angle += (rotate ? 0.01 : 0);
    camera.position.x = center[0] + Math.cos(angle) * radius;
    camera.position.z = center[2] + Math.sin(angle) * radius;
    camera.lookAt(center[0], center[1], center[2]);
    renderer.render( scene, camera );
}

// Check if WebGL2 is available and start animation loop