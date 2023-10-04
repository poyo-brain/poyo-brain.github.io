import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

import { FontLoader } from './FontLoader.js';
import { TextGeometry } from './TextGeometry.js';

THREE.ColorManagement.enabled = false

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl-decode-sample')

// Scene
const scene = new THREE.Scene()

/**
 * Load data
 */

const sequenceLength = 3; // length of the sequence that will be displayed, all data will be truncated
let spikeMeshes = [];
let velocityCurves = []

async function loadData(source) {
    console.log('loading data from ' + source);
    const response = await fetch(source);
    const data = await response.json();

    // Remove old spikes
    spikeMeshes.forEach(mesh => {
        // Dispose of old geometries and materials to avoid memory leaks
        mesh.geometry.dispose();
        mesh.material.dispose();
        // Remove mesh from scene
        scene.remove(mesh);
    });

    // Remove old curves
    velocityCurves.forEach(line => {
        scene.remove(line);
    });

    // Get number of spikes and number of units
    const count = data.spike_timestamps.length;
    const maxUnitId = Math.max(...data.spike_unit_id);
    
    // Define the cylinder geometry for the spike
    const segmentHeight = 2. / maxUnitId; // Adjust as needed
    const segmentRadius = 0.004; // Adjust as needed
    const cylinderGeometry = new THREE.CylinderGeometry(segmentRadius, segmentRadius, segmentHeight, 8);
    const spikeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Create the mesh for each spike
    for(let i = 0; i < count; i++) {
        const x = data.spike_timestamps[i]; // x values will be between 0 and sequenceLength (3)
        const y = data.spike_unit_id[i] / maxUnitId * (2 - 2 * segmentHeight) - 1.0 + segmentHeight;  // y values will be between -1 and 1
        if (x > sequenceLength) {
            continue;
        }
        const segment = new THREE.Mesh(cylinderGeometry, spikeMaterial);
        segment.position.set(x, y, 0);
        scene.add(segment);
        spikeMeshes.push(segment);
    }

    // materials for curves
    const groundTruthMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2}); // Black color
    const predictedMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color

    // load ground truth velocity x
    const vPointsx = data.v_timestamps.map((t, idx) => new THREE.Vector3(t, data.vx_gt[idx] / 2 + 0.5, 0));
    const lineGeometryx = new THREE.BufferGeometry().setFromPoints(vPointsx);
    const linex = new THREE.Line(lineGeometryx, groundTruthMaterial);
    scene.add(linex);
    velocityCurves.push(linex);

    // load ground truth velocity y
    const vPointsy = data.v_timestamps.map((t, idx) => new THREE.Vector3(t, data.vy_gt[idx] / 2 - 0.5, 0));
    const lineGeometryy = new THREE.BufferGeometry().setFromPoints(vPointsy);
    const liney = new THREE.Line(lineGeometryy, groundTruthMaterial);
    scene.add(liney);
    velocityCurves.push(liney);

    // load predicted velocity x
    const vPointsxpp = data.v_timestamps.map((t, idx) => new THREE.Vector3(t, data.vx_pred_poyo_1[idx] / 2 + 0.5, 0));
    const lineGeometryxpp = new THREE.BufferGeometry().setFromPoints(vPointsxpp);
    const linexpp = new THREE.Line(lineGeometryxpp, predictedMaterial);
    scene.add(linexpp);
    velocityCurves.push(linexpp);

    const vPointsypp = data.v_timestamps.map((t, idx) => new THREE.Vector3(t, data.vy_pred_poyo_1[idx] / 2 - 0.5, 0));
    const lineGeometryypp = new THREE.BufferGeometry().setFromPoints(vPointsypp);
    const lineypp = new THREE.Line(lineGeometryypp, predictedMaterial);
    scene.add(lineypp);
    velocityCurves.push(lineypp);

    const offsetX = 4; // Adjust this value based on your specific layout
    velocityCurves.forEach(line => {
        line.position.x += offsetX;
    });
}

loadData('./assets/sample_1.json');

/**
 * Add spike slider
 */
// Add square
// Define the geometry for the rectangle
const rectangleWidth = 1;  // Adjust as needed
const rectangleHeight = 2; // Adjust to cover the full height, since we have normalized the spike height to [-1, 1]
const rectangleGeometry = new THREE.PlaneGeometry(rectangleWidth, rectangleHeight);

// Define the material for the rectangle
const rectangleColor = new THREE.Color('#999999');
const rectangleMaterial = new THREE.MeshBasicMaterial({
    color: rectangleColor,
    transparent: true,
    opacity: 0.1
});

// Create the mesh and add it to the scene
const rectangleMesh = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
rectangleMesh.position.x = 0;
scene.add(rectangleMesh);

// Add border to the mesh
const borderGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
    -0.5, -1, 0,
     0.5, -1, 0,
     0.5,  1, 0,
    -0.5,  1, 0,
    -0.5, -1, 0
]);
borderGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

const borderMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });  // Black color

const border = new THREE.LineSegments(borderGeometry, borderMaterial);
scene.add(border);


/**
 * Add axes to the velocity curves
 */
// Create a line to represent the X-axis
const xAxisGeometry1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(3, -1, 0)  // Adjust the length as per your requirement
]);
const xAxisMaterial1 = new THREE.LineBasicMaterial({ color: 0x000000 }); // Red color
const xAxisLine1 = new THREE.Line(xAxisGeometry1, xAxisMaterial1);
scene.add(xAxisLine1);

// Create a line to represent the Y-axis
const yAxisGeometry1 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, -0.1, 0)  // Adjust the length as per your requirement
]);
const yAxisMaterial1 = new THREE.LineBasicMaterial({ color: 0x000000 }); // Green color
const yAxisLine1 = new THREE.Line(yAxisGeometry1, yAxisMaterial1);
scene.add(yAxisLine1);

const xAxisGeometry2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(3, 0, 0)  // Adjust the length as per your requirement
]);
const xAxisMaterial2 = new THREE.LineBasicMaterial({ color: 0x000000 }); // Red color
const xAxisLine2 = new THREE.Line(xAxisGeometry2, xAxisMaterial2);
scene.add(xAxisLine2);

// Create a line to represent the Y-axis
const yAxisGeometry2 = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.9, 0)  // Adjust the length as per your requirement
]);
const yAxisMaterial2 = new THREE.LineBasicMaterial({ color: 0x000000 }); // Green color
const yAxisLine2 = new THREE.Line(yAxisGeometry2, yAxisMaterial2);
scene.add(yAxisLine2);

// Add labels to the axes
const loader = new FontLoader();
loader.load('./assets/helvetiker_regular.typeface.json', (font) => {
    const textSize = 0.08; // Adjust as per your requirement
    const textColor = 0x000000; // Black color
    
    // X-axis label
    const xAxisTextGeometry = new TextGeometry('time', {
        font: font,
        size: textSize,
        height: 0.01,
    });
    const xAxisTextMaterial = new THREE.MeshBasicMaterial({ color: textColor });
    const xAxisTextLabel = new THREE.Mesh(xAxisTextGeometry, xAxisTextMaterial);
    xAxisTextLabel.position.x = 3.04; // Adjust the position as per your requirement
    xAxisTextLabel.position.y = -0.05; // Adjust the position as per your requirement

    scene.add(xAxisTextLabel);
    
    // Y-axis label
    const yAxisTextGeometry = new TextGeometry('vx', {
        font: font,
        size: textSize,
        height: 0.01,
    });
    const yAxisTextMaterial = new THREE.MeshBasicMaterial({ color: textColor });
    const yAxisTextLabel = new THREE.Mesh(yAxisTextGeometry, yAxisTextMaterial);
    yAxisTextLabel.position.y = 0.45; // Adjust the position as per your requirement
    scene.add(yAxisTextLabel);

    const yAxisTextGeometry2 = new TextGeometry('vy', {
        font: font,
        size: textSize,
        height: 0.01,
    });
    const yAxisTextMaterial2 = new THREE.MeshBasicMaterial({ color: textColor });
    const yAxisTextLabel2 = new THREE.Mesh(yAxisTextGeometry2, yAxisTextMaterial2);
    yAxisTextLabel2.position.y = -0.55; // Adjust the position as per your requirement
    scene.add(yAxisTextLabel2);

    const plotOffsetX = 4; // Adjust based on your spike plot dimensions and layout
    xAxisLine1.position.x = plotOffsetX;
    yAxisLine1.position.x = plotOffsetX;
    xAxisLine2.position.x = plotOffsetX;
    yAxisLine2.position.x = plotOffsetX;
    xAxisTextLabel.position.x += plotOffsetX;
    yAxisTextLabel.position.x += plotOffsetX - 0.2;
    yAxisTextLabel2.position.x += plotOffsetX - 0.2;


    xAxisLine1.position.z += 0.02;
    yAxisLine1.position.z += 0.02;
    xAxisLine2.position.z += 0.02;
    yAxisLine2.position.z += 0.02;
    xAxisTextLabel.position.z += 0.02;
    yAxisTextLabel.position.z += 0.02;
    yAxisTextLabel2.position.z += 0.02;
});


/**
 * Create a fake mask to hide the curves
*/

// Geometry
const maskWidth = 4;  // Assume 3 is enough to cover from the right edge of the draggable square to the end of the line plot. Adjust as necessary.
const maskHeight = 4;  // Adjust as per your requirement, should be enough to cover the entire height of the line plot.
const maskGeometry = new THREE.PlaneGeometry(maskWidth, maskHeight);

// Material
const maskMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF  // Assume the background is white. Adjust the color to match your background.
});

// Mesh
const maskMesh = new THREE.Mesh(maskGeometry, maskMaterial);
scene.add(maskMesh);

maskMesh.position.x = 4;
maskMesh.position.z = 0.01

/**
 * Make slider draggable
 */
let mouseX = 0;
let isDragging = false;

canvas.addEventListener('mousedown', (event) => {
    // Check if the mouse is over the rectangle
    const mouseXNormalized = (event.clientX / sizes.width) * 2 - 1;
    const mouseYNormalized = -(event.clientY / sizes.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(mouseXNormalized, mouseYNormalized);

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(rectangleMesh);

    if (intersects.length > 0) {
        isDragging = true;
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging) {
        // Normalize the mouse x-coordinate to be within [-aspectRatio, aspectRatio]
        mouseX = (event.clientX / sizes.width) * 2 * aspectRatio;
        mouseX = Math.min(mouseX, 3.0 - 0.5);
    }
});


/**
 * Sizes
 */
const sizes = {
    width: 1000,  // match the width set in CSS
    height: 300  // match the height set in CSS
}

/**
 * Camera
 */
// Base camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(
    -0.1, 
    7.9, 
    4 / aspectRatio, 
    -4 / aspectRatio, 
    0.1, 
    100);

camera.position.z = 3
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true
// controls.enableRotate = false; // Disable rotation for a 2D view


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Set the background color to white
renderer.setClearColor(0xFFFFFF, 1);  // 0xFFFFFF is the hexadecimal value for white

/**
 * Select file callback
 */
document.getElementById('data-source').addEventListener('change', function(e) {
    const newDataSource = e.target.value;
    loadData(newDataSource);
});

/** 
 * Play button annimation
 */
const playButton = document.getElementById('playButton');
const clock = new THREE.Clock()

let isPlayingTrajectory = false;
let trajectoryStartTime = 0;

rectangleMesh.position.x = 0. ;
border.position.x = 0;
maskMesh.position.x = 4 + 1.5 + rectangleWidth;

playButton.addEventListener('click', () => {
    isPlayingTrajectory = true;
    if (rectangleMesh.position.x > 3) {
        rectangleMesh.position.x = 0.5;
        border.position.x = 0.5;
        maskMesh.position.x = 4 + 1.5 + rectangleWidth;
    }
    trajectoryStartTime = clock.getElapsedTime();
});

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (isPlayingTrajectory) {
        const timeSinceStart = elapsedTime - trajectoryStartTime;
        if (rectangleMesh.position.x > 3) {
            isPlayingTrajectory = false;
        } else {
            rectangleMesh.position.x = 0.5 + mouseX + timeSinceStart;
            border.position.x = 0.5 + mouseX + timeSinceStart;
            maskMesh.position.x = 4 + 1.5 + mouseX + rectangleWidth + timeSinceStart;
        }
    }

    // Update rectangle
    if (isDragging) {
        // Update the rectangle position
        rectangleMesh.position.x = 0.5 + mouseX;
        border.position.x = 0.5 + mouseX;
        maskMesh.position.x = 4 + 1.5 + mouseX + rectangleWidth;
    }

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
}

tick()