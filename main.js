import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { OutlinePass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/OutlinePass.js';
// import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.173.0/examples/jsm/postprocessing/RenderPass.js';

let langFile = {};

fetch('lang/en.lang')
    .then(response => response.text())
    .then(data => {
        langFile["en"] = data.replaceAll(/^\/\/.*$/gm, '');
        console.log(data.replaceAll(/^\/\/.*$/gm, ''))
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

function getPath(path, type="textures") {
    switch (type) {
        case "textures":
            return "textures/" + path + ".png";
        case "models":
            return "models/" + path + ".gltf";
        case "states":
            return "blockstates/" + path + ".json";
    }
}

function constructScene(blocksData) {
    blocksData.forEach(function(element) {
        const filePath = element.namespace + "/" + element.id;
        fileExistence(getPath(filePath, "states"), function(stateExists) {
            if (stateExists) {

            } else {
                fileExistence(getPath(filePath, "models"), function(modelExists) {
                    if (modelExists) {
                        console.log("nadnsads")
                        const loader = new GLTFLoader();
                        loader.load(getPath(filePath, "models"), function (gltf) {
                            console.log("nadnsads")
                            // Store the loaded model for later use
                            gltf.objectData = {
                                namespace: element.namespace,
                                id: element.id
                            };
                            gltf.position.set(element.position[0], element.position[1], element.position[2]);
                            scene.add(gltf.scene);
                            savedBlocks.push(gltf);
                        }, undefined, function ( error ) {
                            console.error( error );
                        });
                    } else {
                        fileExistence(getPath(filePath, "textures"), function(textureExists) {
                            const texture = new THREE.TextureLoader().load(textureExists ? getPath(filePath, "textures") : "textures/missing.png");
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
                                id: element.id
                            };
                
                            cube.position.set(element.position[0], element.position[1], element.position[2]);
                            scene.add(cube);
                
                            // Add the cube to the blocks array for raycasting
                            savedBlocks.push(cube);
                        })
                    }
                })
            }
        });
    });
}

function handleFile(file) {
    document.querySelector('#fileUpload').style.opacity = 0;
    setTimeout(function(){
        document.querySelector('#fileUpload').style.display = "none";
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
                    console.log("Error parsing NBT file: " + error.message);
                    return;
                }

                console.log(JSON.stringify(data, null, 2))
                console.log(data.value.blocks.value.value)
                console.log(data.value.size.value.value)
                let blocks = []
                data.value.blocks.value.value.forEach(function(element) {
                    const block = {
                        namespace: element.nbt.value.id.value.split(":")[0],
                        id: element.nbt.value.id.value.split(":")[1],
                        position: element.pos.value.value
                    }
                    blocks.push(block)
                });
                console.log(blocks)

                // Extract size (assuming it's stored in the root compound)
                const size = data.value.size.value.value;
                const xyz = [size[0], size[1], size[2]]; // ZYX order

                // Extract blocks (assuming it's stored under 'blocks')
                // const blocks = data.value.blocks.value; 

                console.log("xyz:", xyz);
                console.log("Blocks:", blocks);
                const center = [(xyz[0] / 2) - 0.5, (xyz[1] / 2) - 0.5, (xyz[2] / 2) - 0.5]

                if ( WebGL.isWebGL2Available() ) {
                    constructScene(blocks)
                    console.log(center)
                    renderer.setAnimationLoop(() => animate(center));
                    blockDisplayRenderer.setAnimationLoop(blockDisplayAnimation);
                } else {
                    const warning = WebGL.getWebGL2ErrorMessage();
                    document.getElementById( 'container' ).appendChild( warning );
                }                
            });
        } catch (err) {
            console.log("Error parsing NBT file: " + err.message);
        }
    };
}

const raycaster = new THREE.Raycaster();

let currentSelection;
let currentSelectionClone;

document.addEventListener('mousedown', (event) => {
    console.log(event.target.id === 'tooltip')
    console.log(event.target.closest("#tooltip") != null)
    console.log(window.getComputedStyle(document.querySelector('#tooltip')).opacity == 0.9)
    console.log((event.target.id === 'tooltip' || event.target.closest("#tooltip") != null)
    && window.getComputedStyle(document.querySelector('#tooltip')).opacity == 0.9)
    if ((event.target.id === 'tooltip' || event.target.closest("#tooltip") != null)
        && window.getComputedStyle(document.querySelector('#tooltip')).opacity == 0.9) {
        return; // Skip the rest of the logic if clicking on #tooltip
    }
    const coords = new THREE.Vector2(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -((event.clientY / renderer.domElement.clientHeight) * 2 - 1)
    );
    console.log(coords)
    raycaster.setFromCamera(coords, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    if (currentSelectionClone) {
        blockDisplay.remove(currentSelectionClone)
    }

    if (intersects.length > 0) {
        // Get the first intersected object
        const object = intersects[0].object;

        // Access the namespace and id from the object
        const namespace = object.objectData.namespace;
        const id = object.objectData.id;
        console.log(object)
        console.log(intersects[0])
        console.log(`Hovered over object with namespace: ${namespace} and id: ${id}`);
        console.log(object.material.map.source)
        currentSelection = object
        if (getLang(object.objectData.namespace + "." + object.objectData.id)
            == object.objectData.namespace + "." + object.objectData.id) {
            document.querySelector('#tooltip #block').innerHTML = object.objectData.namespace + ":" + object.objectData.id;
            document.querySelector('#tooltip #namespacesay').innerHTML = "";
            document.querySelector('#tooltip #namespace').innerHTML = "";
        } else {
            document.querySelector('#tooltip #block').innerHTML = getLang(object.objectData.id);
            if (object.objectData.namespace == "minecraft") {
                document.querySelector('#tooltip #namespacesay').innerHTML = "";
                document.querySelector('#tooltip #namespace').innerHTML = "";
            } else {
                document.querySelector('#tooltip #namespacesay').innerHTML = "in";
                document.querySelector('#tooltip #namespace').innerHTML = getLang(object.objectData.namespace);
            }
        }
        document.querySelector('#tooltip #position').innerHTML = object.position.toArray().join(", ");
        document.querySelector('#tooltip').style.opacity = 0.9;
        document.querySelector('#tooltip').style.opacity = 0.9;
        document.querySelector('#tooltip').style.opacity = 0.9;
        currentSelectionClone = object.clone();
        currentSelectionClone.position.set(2, 2, 2)
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
    handleFile(event.target.files[0])
});

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
let camerabuffer = 0;
// Animation loop

function blockDisplayAnimation() {
    blockDisplayRenderer.render( blockDisplay, blockDisplayCamera );
}

function animate(center) {
    camerabuffer += 1
    if (camerabuffer >= 600) {
        console.log(camera.position);
        camerabuffer = 0;
    }
    const radius = 10;
    angle += 0.01; // Adjust speed
    camera.position.x = center[0] + Math.cos(angle) * radius;
    camera.position.z = center[2] + Math.sin(angle) * radius;
    camera.lookAt(center[0], center[1], center[2]); // Keep looking at the center

    renderer.render( scene, camera );
}

// Check if WebGL2 is available and start animation loop