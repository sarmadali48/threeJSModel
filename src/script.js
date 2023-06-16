import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import * as dat from "dat.gui";

// cursor:

// const cursor = {
//     x : 0,
//     y : 0
// }
// window.addEventListener('mousemove', (event)=> {
//     cursor.x = (event.clientX /sizes.width - 0.5);
//     cursor.y = - (event.clientY / sizes.height - 0.5);
//     // cursor.z = (event.c / sizes.height -0.5 );

//     console.log(cursor.x, cursor.y);
// })

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Models

const dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath("/draco/")

const gltfLoader = new GLTFLoader();
// gltfLoader.setDRACOLoader(dracoLoader);

let mixer = null;

gltfLoader.load(
  "/models/Corridor/corridor_02.glb",
  // 'models/Duck/glTF-Draco/Duck.gltf',
  (gltf) => {
    console.log("success");
    console.log("This is gltf: ", gltf);

    mixer = new THREE.AnimationMixer(gltf.scene);
    // const action = mixer.clipAction(gltf.animations[1])
    // action.play();
    gltf.animations.forEach(function (clip) {
      mixer.clipAction(clip).play();
    });

    // console.log("This is action: ", action);

    gltf.scene.scale.set(0.25, 0.25, 0.25);
    scene.add(gltf.scene);
  },
  () => {
    console.log("progress");
  },
  () => {
    console.log("error");
  }
);

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: "#444444",
    metalness: 0,
    roughness: 0.5,
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
// scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Load Texture
const rgbe_loader = new RGBELoader();

rgbe_loader.setDataType(THREE.UnsignedByteType);
rgbe_loader.load("/models/Corridor/corridor_02.glb", function (texture) {
  console.log("This si envMap: ");
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;

  scene.background = envMap;
  scene.environment = envMap;

  renderer.render(scene, camera);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);

// const aspectRatio = sizes.width / sizes.height
// const camera = new THREE.OrthographicCamera(-1 * aspectRatio, 1 * aspectRatio, 1, -1, 0.1, 100)

camera.position.set(2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.75, 0);
controls.enableDamping = true;
controls.enableRotate = true;
controls.enableKeys = true;

// Create controls for camera movement
// const controls = new THREE.OrbitControls(camera, canvas);

// Disable rotation and enable first-person movement
// controls.enableRotate = false;
// controls.enableKeys = true;

// Set initial camera position and target
// camera.position.set(0, 1.6, 5);
// controls.target.set(0, 1.6, 0);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputEncoding = THREE.sRGBEncoding;
// document.body.appendChild( renderer.domElement );

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  //update mixer
  if (mixer !== null) {
    mixer.update(deltaTime);
  }

  // update camera
  // camera.position.x = cursor.x * 3
  // camera.position.y = cursor.y * 3

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
