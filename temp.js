import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

document.getElementById('nbtFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
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
                        id: element.nbt.value.id.value,
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
            });
        } catch (err) {
            console.log("Error parsing NBT file: " + err.message);
        }
    };
});

const scene = new THREE.Scene();

// Create Orthographic Camera
const aspectRatio = window.innerWidth / window.innerHeight;
const frustumSize = 10; // Adjust to zoom in or out
const camera = new THREE.OrthographicCamera(
    -frustumSize * aspectRatio / 2,  // Left
    frustumSize * aspectRatio / 2,   // Right
    frustumSize / 2,                 // Top
    -frustumSize / 2,                // Bottom
    1,                               // Near
    500                              // Far
);

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Load the texture
const texture = new THREE.TextureLoader().load( "textures/minecraft/dirt.png" );
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 1, 1 );

// Set up the cube
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { map: texture } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// Adjust camera position
camera.position.z = 5; // The position on the Z axis might still need adjustment based on your scene scale

// Variables to store the loaded gltf model
let gltfModel = null;

// Load the GLTF model asynchronously
const loader = new GLTFLoader();
loader.load( 'models/minecraft/acacia_trapdoor_open.gltf', function (gltf) {
    // Store the loaded model for later use
    gltfModel = gltf;
    scene.add( gltf.scene );
}, undefined, function ( error ) {
    console.error( error );
});

// Animation loop
function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Only animate the loaded model if it's available
    if (gltfModel) {
        // Example: Rotate the loaded model if it's available
        gltfModel.scene.rotation.x += 0.01;
        gltfModel.scene.rotation.y += 0.01;
    }

    renderer.render( scene, camera );
}

// Check if WebGL2 is available and start animation loop
if ( WebGL.isWebGL2Available() ) {
    renderer.setAnimationLoop( animate );
} else {
    const warning = WebGL.getWebGL2ErrorMessage();
    document.getElementById( 'container' ).appendChild( warning );
}
