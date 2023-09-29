// import * as THREE from 'three';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

// import * as THREE from './libs/three.module.js';

import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';
import { OrbitControls } from './OrbitControls.js';

THREE.ColorManagement.enabled = false

/**
 * Base
 */
// Debug
// const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xFFFFFF);  // Set the background color to white

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load('./assets/textures/particles/1.png')

/**
 * Load data
 */
let particlePositions = [];
let lastTime = 0;

// Load the particle positions from data.json
fetch('./assets/data.json') // replace '/path/to/data.json' with the actual path to your JSON file
    .then(response => response.json())
    .then(data => {
        particlePositions = data;
        lastTime = particlePositions.cursor_t[particlePositions.cursor_t.length - 1];
        initParticles(); // Initialize particles after loading data
        tick(); // Start the animation after initializing particles
    });



const uniforms = {
    uZThreshold: { value: 0 },  // starting threshold, adjust as needed
    uColor: { value: new THREE.Color('#ff88cc') },
    uTexture: { value: particleTexture }
};

// Shader material
const particlesMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexColors: true,
    vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vZ;
        void main() {
            vColor = color;
            vZ = position.z;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 3.0; //size ; //* (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float uZThreshold;
        uniform vec3 uColor;
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vZ;
        void main() {
            if (vZ < uZThreshold) discard;
            // gl_FragColor = vec4(uColor * vColor, 1.0) * texture2D(uTexture, gl_PointCoord).a;
            vec4 textureAlpha = texture2D(uTexture, gl_PointCoord);
            gl_FragColor = vec4(uColor * vColor, textureAlpha.a);
        }
    `
});

/**
 * Particles
 */
const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1 * 3), 3))
let particles;
let count = 0
function initParticles() {
    // Geometry
    // const particlesGeometry = new THREE.BufferGeometry()
    const count = particlePositions.cursor_x.length;

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for(let i = 0; i < count; i++) {
        positions[i * 3] = (particlePositions.cursor_x[i] - 3) / 5;
        positions[i * 3 + 1] = (particlePositions.cursor_y[i] + 33) /5;
        positions[i * 3 + 2] = - 15. - ((particlePositions.cursor_t[i]) - lastTime) / 20;
        
        // random colors
        // colors[i * 3] = Math.random();
        // colors[i * 3 + 1] = Math.random();
        // colors[i * 3 + 2] = Math.random();
        colors[i * 3] = 1;
        colors[i * 3 + 1] =1;
        colors[i * 3 + 2] = 1;
    }


    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    
    // Material

    // const sizesArray = new Float32Array(count); // assuming 'count' is the number of points
    // for (let i = 0; i < count; i++) {
    //     sizesArray[i] = 2;  // Adjust this value for the desired size
    // }
    // particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));
    

    // const particlesMaterial = new THREE.PointsMaterial()

    // particlesMaterial.size = 0.1
    // particlesMaterial.sizeAttenuation = true

    // particlesMaterial.color = new THREE.Color('#ff88cc')

    // particlesMaterial.transparent = true
    // particlesMaterial.alphaMap = particleTexture
    // // particlesMaterial.alphaTest = 0.01
    // // particlesMaterial.depthTest = false
    // particlesMaterial.depthWrite = false
    // particlesMaterial.blending = THREE.AdditiveBlending

    // particlesMaterial.vertexColors = true

    // Points
    particles = new THREE.Points(particlesGeometry, particlesMaterial)

    scene.add(particles)
}

/**
 * Frame
 */

// Square dimensions
const squareSize = 4;  // Adjust this value as needed

// 1. Create square geometry
const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);

// 2. Create a white border
const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
const edges = new THREE.EdgesGeometry(squareGeometry);
const border = new THREE.LineSegments(edges, borderMaterial);

// 3. Position the square and its border on the z=0 plane
// Since PlaneGeometry creates a square on the xy plane by default, we don't need to rotate it.
border.position.z = 0;

// Add the border to the scene
scene.add(border);

// 1. Load the font
const loader = new FontLoader();
loader.load('./assets/helvetiker_regular.typeface.json', function (font) {
    
    // 2. Create text geometries and materials
    const textSize = 0.12;  // Adjust as needed
    const textThickness = 0.05;  // Adjust as needed
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });  // Black color for the text

    const xAxisGeometry = new TextGeometry('x', {
        font: font,
        size: textSize,
        height: textThickness,
        curveSegments: 12,
    });
    const xAxisText = new THREE.Mesh(xAxisGeometry, textMaterial);
    xAxisText.position.set(0, -squareSize*0.51 - textSize, 0);  // Positioning under the square
    xAxisText.rotation.set(0, Math.PI, 0);  // Rotate the text to face upwards

    scene.add(xAxisText);

    const yAxisGeometry = new TextGeometry('y', {
        font: font,
        size: textSize,
        height: textThickness,
        curveSegments: 12,
    });
    const yAxisText = new THREE.Mesh(yAxisGeometry, textMaterial);
    yAxisText.position.set(squareSize * 0.51 + textSize, 0, 0);  // Positioning on the left side of the square
    yAxisText.rotation.set(Math.PI, 0, -Math.PI / 2);  // Rotate the text to face upwards
    scene.add(yAxisText);

    const titleGeometry = new TextGeometry('Cursor position', {
        font: font,
        size: textSize,
        height: textThickness,
        curveSegments: 12,
    });
    const titleText = new THREE.Mesh(titleGeometry, textMaterial);
    titleText.position.set(squareSize * 0.13, squareSize/2 + textSize, 0);  // Positioning above the square
    titleText.rotation.set(0, Math.PI, 0);
    scene.add(titleText);
    
});


/**
 * Sizes
 */
const sizes = {
    width:  400, // canvas.clientWidth,
    height: 400, //canvas.clientHeight
}
// camera.aspect = canvas.clientWidth / canvas.clientHeight;


window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera: OrthographicCamera
const camera = new THREE.OrthographicCamera(
    - 3 * sizes.width / sizes.height, // left
    3 * sizes.width / sizes.height, // right
    3, // top
    -3, // bottom
    0.01, // near
    100 // far
)
// const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, -2); // or any positive z-value
camera.lookAt(0, 0, 0); // Looking at the origin

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// renderer.setClearColor(0xFFFFFF);  // Set the clear color to white

/**
 * Animate
 */
const clock = new THREE.Clock()

let currentZThreshold = -5;  // Starting threshold. Adjust this value as needed.

const tick = () => {

    const elapsedTime = clock.getElapsedTime();

    // Increase the threshold
    particlesMaterial.uniforms.uZThreshold.value -=0.01;  // Adjust the 0.01 value to control the speed of revealing
    particles.position.z += 0.01;

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()