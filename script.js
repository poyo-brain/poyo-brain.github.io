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

function setupCanvas(canvasId, dataFilePath, color) {
    // Canvas
    // const canvas = document.querySelector('canvas.webgl')
    const canvas = document.querySelector(`#${canvasId}`)
    console.log(canvas)
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
    fetch(dataFilePath) // replace '/path/to/data.json' with the actual path to your JSON file
        .then(response => response.arrayBuffer())
        .then(data => mat4js.read(data))
        .then(data => data.data)
        .then(data => {
            particlePositions = data;
            lastTime = particlePositions.cursor_t[particlePositions.cursor_t.length - 1];
            initParticles(); // Initialize particles after loading data
            tick(); // Start the animation after initializing particles
        });



    const uniforms = {
        uZThreshold: { value: 0 },  // starting threshold, adjust as needed
        uColor: { value: new THREE.Color(color) },
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
        uniform float uZThreshold;
        attribute float size;
        varying vec3 vColor;
        varying float vZ;
        void main() {
            vColor = color;
            vZ = position.z;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 3.0; 
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
            float zmax = 4.0;
            if (vZ < uZThreshold) discard;
            if (vZ > uZThreshold + zmax) discard;
            float alpha = 1.0 - ((vZ - uZThreshold) / zmax);
            gl_FragColor = vec4(uColor * vColor * (0.6 + (1.0 - alpha)), alpha);
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

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 2 * particlePositions.cursor_x[i] // (particlePositions.cursor_x[i] - 0) / 5;
            positions[i * 3 + 1] = 2 * particlePositions.cursor_y[i] // (particlePositions.cursor_y[i] + 30) / 5;
            // positions[i * 3 + 2] =  - 45. / 900 * lastTime - ((particlePositions.cursor_t[i]) - lastTime) / 20;
            positions[i * 3 + 2] =  - 60 * 5  /20. - ((particlePositions.cursor_t[i]) - 60 * 5) / 20;

            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
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
        const textSize = 0.18;  // Adjust as needed
        const textThickness = 0.02;  // Adjust as needed
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });  // Black color for the text

        const xAxisGeometry = new TextGeometry('x', {
            font: font,
            size: textSize,
            height: textThickness,
            curveSegments: 12,
        });
        const xAxisText = new THREE.Mesh(xAxisGeometry, textMaterial);
        xAxisText.position.set(0, -squareSize * 0.51 - textSize, 0);  // Positioning under the square
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
        titleText.position.set(squareSize * 0.22, squareSize / 2 + textSize, 0);  // Positioning above the square
        titleText.rotation.set(0, Math.PI, 0);
        scene.add(titleText);

    });


    /**
     * Sizes
     */
    const sizes = {
        width: 220, // canvas.clientWidth,
        height: 220, //canvas.clientHeight
    }

    // window.addEventListener('resize', () =>
    // {
    //     // Update sizes
    //     sizes.width = window.innerWidth
    //     sizes.height = window.innerHeight

    //     // Update camera
    //     camera.aspect = sizes.width / sizes.height
    //     camera.updateProjectionMatrix()

    //     // Update renderer
    //     renderer.setSize(sizes.width, sizes.height)
    //     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    // })

    /**
     * Camera
     */
    // Base camera: OrthographicCamera
    const camera = new THREE.OrthographicCamera(
        - 2.7 * sizes.width / sizes.height, // left
        2.7 * sizes.width / sizes.height, // right
        2.7, // top
        -2.7, // bottom
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
    controls.enableZoom = false;  // Disable zooming

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
    // renderer.setClearColor(0xFFFFFF);  // Set the clear color to white

    /**
     * Animate
     */
    const clock = new THREE.Clock()
    const speed = 0.002;

    // Moving camera
    let animationStartTime = null;
    const animationDuration = 4000;  // 4 seconds in milliseconds
    console.log(camera.position)
    let targetPosition = new THREE.Vector3(-2, 2, -4);

    let targetLeft = -3 * sizes.width / sizes.height;
    let targetRight = 3 * sizes.width / sizes.height;
    let targetTop = 3;
    let targetBottom = -3;

    const toggleSwitch = document.querySelector(`.switch[data-canvas-id="${canvasId}"] .toggle-input`);

    // const button = document.querySelector(`.toggle-button[data-canvas-id="${canvasId}"]`);
    let is3D = true;  // Start in 2D mode

    toggleSwitch.addEventListener('change', () => {
        is3D = !is3D;  // Toggle the mode

        if (is3D) {
            targetPosition = new THREE.Vector3(-2, 2, -4);
            targetLeft = -3 * sizes.width / sizes.height;
            targetRight = 3 * sizes.width / sizes.height;
            targetTop = 3;
            targetBottom = -3;
        } else {
            targetPosition = new THREE.Vector3(0, 0, -4);
            targetLeft = -2.7 * sizes.width / sizes.height;
            targetRight = 2.7 * sizes.width / sizes.height;
            targetTop = 2.7;
            targetBottom = -2.7;
        }
        console.log(targetPosition);
        // camera.lookAt(0, 0, 0);  // Adjust as needed based on your scene
    });

    const tick = () => {

        const elapsedTime = clock.getElapsedTime();

        // Increase the threshold
        // console.log(particles.position.z);
        if (particles.position.z < 15) {
            particlesMaterial.uniforms.uZThreshold.value -= speed;
            particles.position.z += speed;
        }
        else {
            particlesMaterial.uniforms.uZThreshold.value = 0;
            particles.position.z = 0;
        }
        // Move the camera
        if (!animationStartTime && elapsedTime > 4) {
            animationStartTime = elapsedTime;
        }
    
        // Update the camera position if the animation has started
        if (animationStartTime) {
            const animationProgress = (elapsedTime - animationStartTime) / animationDuration;
            if (animationProgress < 1) {
                camera.position.lerp(targetPosition, animationProgress);
                camera.left = THREE.MathUtils.lerp(camera.left, targetLeft, animationProgress);
                camera.right = THREE.MathUtils.lerp(camera.right, targetRight, animationProgress);
                camera.top = THREE.MathUtils.lerp(camera.top, targetTop, animationProgress);
                camera.bottom = THREE.MathUtils.lerp(camera.bottom, targetBottom, animationProgress);
                camera.updateProjectionMatrix();  // Important! Update the camera's projection after changing its frustum
            } else {
                camera.position.copy(targetPosition);
                camera.left = targetLeft;
                camera.right = targetRight;
                camera.top = targetTop;
                camera.bottom = targetBottom;
                camera.updateProjectionMatrix();
            }
        }
        

        // Update controls
        controls.update()

        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(tick)
    }

    // tick()

}

setupCanvas('webgl1', './assets/trajectory_co.mat', '#88ebff');
setupCanvas('webgl2', './assets/trajectory_rt.mat', '#4cff00');
setupCanvas('webgl3', './assets/trajectory_touch_rt.mat', '#9000ff');
setupCanvas('webgl4', './assets/trajectory_maze.mat', '#ff2f00');
