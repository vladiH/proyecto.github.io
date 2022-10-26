import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {GUI} from "../lib/lil-gui.module.min.js"; 
import {TWEEN} from "../lib/tween.module.min.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import * as CANNON from '../lib/cannon-es.module.js';
import CannonDebugger from '../lib/cannon-es-debugger.js';

import {CharacterControls} from "./character_controls.js";

// Variables estandar
let renderer, scene, camera, cameraHelper, cannonDebuger, characterControls;
let world, groundMaterial, playerBody, characterMesh, soundSpeeder;
let speed = 0, maxSpeed=1, minSpeed=0, acceleration=0.25, angle = 0;
let chaseCam, chaseCamPivot; //position1 position2 of chaseCam
let view = new THREE.Vector3(); //world position
let  insetWidth, insetHeight;
const path = '../proyecto.github.io'
const timeStep = 1/60;
const textureLoader = new THREE.TextureLoader();

// let cameraControls;
const clock = new THREE.Clock();

// CONTROL KEYS
const keysPressed = {  }

// Acciones
initScene();
initWorld();
//initSound();
initChaseCam();
// initOrbitControls();
createGround();
createStadium();
createPlayer();
createRamp();
//loadScene();
render();


function initScene()
{
    //Inicializacion de la escena
    scene = new THREE.Scene();
    const format = '.png';
    const entorno = [ "bkg1_right"+ format, "bkg1_left"+ format,
                      "bkg1_top"+ format, "bkg1_bot"+ format,
                      "bkg1_front"+ format, "bkg1_back"+ format];
    scene.background = new THREE.CubeTextureLoader().setPath(path+'/textures/world/').load(entorno)

    //Inicializacion de camaras
    const ar = window.innerWidth / window.innerHeight;
    setCameras(ar);

    //Inicializacion del motor de render
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(0x7c7b82);
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    //Add lights
    lights();

    //Inicializacion de eventos
    // window.addEventListener('resize',onWindowResize);
    window.addEventListener('keydown',onKeyDown, false);
    window.addEventListener('keyup',onKeyUp, false);
    onWindowResize();
}
// function initOrbitControls(){
//     cameraControls = new OrbitControls( camera, renderer.domElement );
//     // cameraControls.minDistance = 2;
//     // cameraControls.maxDistance = 10;
//     cameraControls.target.set(0,10,0);
// }

function initWorld(){
    world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.81, 0),
    });

    cannonDebuger = CannonDebugger(scene,world,{
        color:0xffffff, 
        scale: 1
    });
}

// function initSound(){
//     const listener = new THREE.AudioListener();
//     camera.add(listener);

//     soundSpeeder = new THREE.Audio(listener);
//     const audioLoader = new THREE.AudioLoader();
//     audioLoader.load(path+'sounds/slow.mp3',function(buffer){
//         soundSpeeder.setBuffer(buffer);
//         soundSpeeder.setLoop(true);
//         soundSpeeder.setVolume(0.5);
//     });
// }

function createGround(){
    groundMaterial = new CANNON.Material('groundMaterial');
    groundMaterial.friction = 0.25;
    groundMaterial.restitution = 0.25;
    const groundShape = new CANNON.Plane();
    //const groundShape = new CANNON.Box(new CANNON.Vec3(12,0.5,12));
    const groundBody = new CANNON.Body({
        mass:0, shape:groundShape, material:groundMaterial
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(groundBody);

    const groundTexture = textureLoader.load(path+'/textures/ground.jpg');
    groundTexture.wrapS= groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(48,48);
    const groundMat = new THREE.MeshStandardMaterial({map:groundTexture, color:"rgb(255,193,69)"});
    const groundGeo = new THREE.BoxGeometry(1000,2,1000);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    scene.add(groundMesh);
    groundMesh.position.set(0,-1,0);
    groundMesh.receiveShadow = true;
}

function createPlayer(){
    const playerMaterial = new CANNON.Material('speederMaterial');
    const slipery_ground_cm = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
        friction: 0.3,
        restitution: 0.1,
        contactEquationStiffness:1e9, 
        frictionEquationStiffness:1e5,
        contactEquationRelaxation:3,
        frictionEquationRelaxation:3
    });
    world.addContactMaterial(slipery_ground_cm);
    const playerShape = new CANNON.Box(new CANNON.Vec3(2,2,4));
    playerBody = new CANNON.Body({
        mass:90, shape:playerShape, material:playerMaterial
    });
    //playerBody.angularDamping = 0.9; //1 less flipping, 0 more flipping
    playerBody.fixedRotation = true; //keeps flipping
    playerBody.updateMassProperties(); // if fixedRotation=true
    // playerBody.position.set(0,1,0);
    playerBody.position = new CANNON.Vec3(0,9,0);
    playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),-Math.PI/2);
    world.addBody(playerBody);

    loadCharacterModel();
}

function createStadium(){
    const stadiumShape = new CANNON.Box(new CANNON.Vec3(20,20,2));
    const stadiumBody = new CANNON.Body({
        mass:0, shape:stadiumShape, material:groundMaterial
    });
    stadiumBody.position = new CANNON.Vec3(0,0.5,0);
    // rotate stadium on x axis by -Math.py/12 (-15 degrees)
    stadiumBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.addBody(stadiumBody);

    const statdiumMat = new THREE.MeshStandardMaterial({
        map:textureLoader.load(path+'/textures/stadium/Color.jpg'),
        normalMap:textureLoader.load(path+'/textures/stadium/NormalGL.jpg'),
        aoMap:textureLoader.load(path+'/textures/stadium/NormalDX.jpg'),
        roughnessMap:textureLoader.load(path+'/textures/stadium/Roughness.jpg'),
        roughness:0.6,
    });
    const stadiumGeo = new THREE.CircleGeometry(20,40);
    const stadiumMesh = new THREE.Mesh(stadiumGeo, statdiumMat);
    scene.add(stadiumMesh);
    stadiumMesh.position.copy(stadiumBody.position);
    stadiumMesh.quaternion.copy(stadiumBody.quaternion);
    stadiumMesh.receiveShadow = true;
}

function createRamp(){
    const rampShape = new CANNON.Box(new CANNON.Vec3(20,1,90));
    const rampBody = new CANNON.Body({
        mass:0, shape:rampShape, material:groundMaterial
    });
    rampBody.position = new CANNON.Vec3(0,1,80);
    // rotate ramp on x axis by -Math.py/12 (-15 degrees)
    rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/12);
    world.addBody(rampBody);

    const rampMat = new THREE.MeshStandardMaterial({color:0x838383});
    const rampGeo = new THREE.BoxGeometry(40,2,180);
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    scene.add(rampMesh);
    rampMesh.position.copy(rampBody.position);
    rampMesh.quaternion.copy(rampBody.quaternion);
    rampMesh.receiveShadow = true;
}

function lights(){
     //lights
     const ambient = new THREE.AmbientLight(0x5b5f97);
     scene.add( ambient );

    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.8);
    direccional.position.set(25,120,25)
    // scene.add(new THREE.DirectionalLightHelper( direccional, 200));
    scene.add(direccional);

    direccional.castShadow = true;
    let d = 600;
    direccional.shadow.mapSize.width = 2048;
    direccional.shadow.mapSize.height = 2048;
    direccional.shadow.camera.near = 0.5;
    direccional.shadow.camera.far = d;
    direccional.shadow.camera.top = d;
    direccional.shadow.camera.bottom = -d;
    direccional.shadow.camera.left = -d;
    direccional.shadow.camera.right = d;

    const focal1 = createSpotlight( 0xFF7F00 );
	const focal2 = createSpotlight( 0x00FF7F);
	const focal3 = createSpotlight( 0x7F00FF);
    focal1.position.set( 15, 40, 45 );
	focal2.position.set( 0, 40, 35 );
	focal3.position.set( - 15, 40, 45 );
    // const focal1Helper = new THREE.SpotLightHelper( focal1);
    // const focal2Helper = new THREE.SpotLightHelper( focal2 );
    // const focal3Helper = new THREE.SpotLightHelper( focal3 );
    // scene.add( focal1Helper );
    // scene.add( focal2Helper );
    // scene.add( focal3Helper );
    scene.add(focal1);
    scene.add(focal2);
    scene.add(focal3);
}

function createSpotlight( color ) {

    const newObj = new THREE.SpotLight( color, 1);
    // newObj.shadow.mapSize.width = 1024;  
    // newObj.shadow.mapSize.height = 1024;
    newObj.castShadow = true;
    newObj.angle = 0.3;
    newObj.penumbra = 0.2;
    newObj.decay = 2;
    newObj.distance = 100;
    //newObj.angle= Math.PI/7;
    //newObj.shadow.camera.near = 800;
    newObj.shadow.camera.far = 20;
    newObj.shadow.camera.fov = 3;
    return newObj;

}

function setCameras(ar){
    camera = new THREE.PerspectiveCamera( 75, ar, 1, 1000);
    camera.position.set(0,10,0);
    //ayudante de camara
    // cameraHelper = new THREE.CameraHelper(camera);
}


function onWindowResize(){
    //actualizamos la matriz de proyeccion de la camara
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    //actualizamos las dimesiones del render
    renderer.setSize( window.innerWidth, window.innerHeight );
    
    const minDim = Math.min( window.innerWidth, window.innerHeight );
    insetWidth = minDim / 4;
    insetHeight = minDim / 4;
}

function onKeyDown(e){
    switch (e.key) {
        case 'ArrowLeft':
            angle += Math.PI/180;
            keysPressed['A'] = true;
            break;
        case 'ArrowRight':
            angle -= Math.PI/180;
            keysPressed['W'] = true;
            break;
        case 'ArrowUp':
            speed += acceleration;
            if (speed>maxSpeed) speed = maxSpeed;
            // if(!soundSpeeder.isPlaying) soundSpeeder.play();
            keysPressed['D'] = true;
            break;
        case 'ArrowDown':
            speed -= acceleration;
            if(speed<minSpeed) {
                speed = minSpeed;
                // if(soundSpeeder.isPlaying) soundSpeeder.stop();
            }
            keysPressed['S'] = true;
            break;
      }
      playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0),angle);
}


function onKeyUp(e){
    if (characterControls) {
        switch (e.key) {
            case 'ArrowLeft':
                keysPressed['A'] = false;    
                break;
            case 'ArrowRight':
                keysPressed['D'] = false;    
                break;
            case 40:
                keysPressed['S'] = false;    
                break;
          }
    }
}

function addObstaclesToWorld(sphereMesh, mesh2, alt, lat, long) {
    const sGeo = sphereMesh.geometry;
    // computer bounding sphere for geometry of the sphere mesh
    sGeo.computeBoundingSphere();
    // use radius value of Sphere instance at 
    // boundingSphere of the geometry of world.mesh
    const radius = sGeo.boundingSphere.radius;
    // position mesh to position of world.mesh, and translate
    // from there using lat, long, alt, and radius of world.mesh
    // using the copy, add, and apply Euler methods of the Vector3 class
    const v1 = new THREE.Vector3(0, radius + alt, 0);
    const x = Math.PI * lat;
    const z = Math.PI * 2 * long;
    const e1 = new THREE.Euler(x, 0, z)
    mesh2.position.copy(sphereMesh.position).add(v1).applyEuler(e1);
}

function movePlayer(){
    // if (speed>maxSpeed) speed = maxSpeed;
    // if (speed<minSpeed) speed = 0;
    playerBody.position.x += speed * Math.sin(angle);
    playerBody.position.z += speed * Math.cos(angle);

    if(characterMesh){
        characterMesh.position.copy(playerBody.position);
        characterMesh.quaternion.copy(playerBody.quaternion);
        camera.lookAt(characterMesh.position);
    }
}
function initChaseCam(){
    chaseCam = new THREE.Object3D();
    chaseCam.position.set(0,0,0);


    chaseCamPivot = new THREE.Object3D();
    chaseCamPivot.position.set(0,3,-10);

    chaseCam.add(chaseCamPivot);

    scene.add(chaseCam);
}
function updateChaseCam(){
    chaseCamPivot.getWorldPosition(view); //get position of object in world(x,y,z) 
    if (view<1) view.y=1;

    //gab beetween chasecam and player
    camera.position.lerpVectors(camera.position,view,0.3);
}

function update()
{   
    // cannonDebuger.update();
    world.step(timeStep);
    movePlayer();
    updateChaseCam();
    let mixerUpdateDelta = clock.getDelta();
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    //cameraControls.update()
}


function render()
{
    requestAnimationFrame(render);
    TWEEN.update();
    renderer.clear();
    update();
    renderer.render(scene,camera);
}

function loadCharacterModel(){
    new GLTFLoader().load(path+'/models/runner.glb', function (gltf) {
        characterMesh = gltf.scene;
        characterMesh.traverse(function (object) {
            if (object.isMesh){ 
                object.castShadow = object.receiveShadow = true;
            }
        });
        characterMesh.scale.set(1,2,2)
        characterMesh.position.copy(playerBody.position);
        characterMesh.quaternion.copy(playerBody.quaternion);
        //playerBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 180*Math.PI/180);
        characterMesh.add(chaseCam);
        scene.add(characterMesh);
        // const gltfAnimations = gltf.animations;
        // const mixer = new THREE.AnimationMixer(characterMesh);
        // const animationsMap = new Map() //Map<string, THREE.AnimationAction>
        // gltfAnimations.filter(a => a.name != 'TPose').forEach((a) => {
        //     animationsMap.set(a.name, mixer.clipAction(a))
        // })
        // characterControls = new CharacterControls(characterMesh, mixer, animationsMap, 
        //     //cameraControls,
        //      camera,  'Idle')
    });
}


// function reset(){
//     angle = 0;
//     speed = 0;
//     if (soundSpeeder.isPlaying) soundSpeeder.stop();
//     playerBody.velocity = new CANNON.Vec3(0,0,0);
//     playerBody.angularVelocity = new CANNON.Vec3(0,0,0);

//     playerBody.quaternion.set(0,0,0,1);
//     playerMesh.quaternion.copy(playerBody.quaternion);

//     playerBody.position.set(0,3,0);
//     playerBody.position.copy(playerBody.position);

// }