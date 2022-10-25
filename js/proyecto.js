import * as THREE from "../lib/three.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {GUI} from "../lib/lil-gui.module.min.js"; 
import {TWEEN} from "../lib/tween.module.min.js";

import {Mundo} from "./mundo.js";

// Variables estandar
let renderer, scene, camera, cameraControls, cameraHelper;
const L =40;

let mundo;
// Otras globales
let robot, suelo, insetWidth, insetHeight, brazoRobotico;
let angulo = 0;

// Acciones
init();
loadScene();
render();


function init()
{
    //Inicializacion de camaras
    const ar = window.innerWidth / window.innerHeight;
    setCameras(ar);

    //Inicializacion de la escena
    scene = new THREE.Scene();

    //Inicializacion del motor de render
    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setClearColor(0x7c7b82);
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    //Inicializacion del control de camara
    enableOrbitControls();
    //Add lights
    lights();

    //Inicializacion de eventos
    window.addEventListener('resize',onWindowResize);
    window.addEventListener('keydown',onKeyDown);
    onWindowResize();
}
function enableOrbitControls(){
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.minDistance = 100;
    cameraControls.maxDistance = 500;
    cameraControls.target.set(0,200,0);
}
function lights(){
     //lights
     const ambient = new THREE.AmbientLight(0x4f1c16);
     scene.add( ambient );

    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.2);
    direccional.position.set(0,1,0)
    //scene.add(new THREE.DirectionalLightHelper( direccional, 200));
    scene.add(direccional);

    const focal1 = createSpotlight( 0x4f1c16 );
	const focal2 = createSpotlight( 0x4f1c16 );
	const focal3 = createSpotlight( 0x4f1c16);
    focal1.position.set( 250, 500, 150 );
	focal2.position.set( 0, 500, -200 );
	focal3.position.set( - 250, 500, 150 );
    // const focal1Helper = new THREE.SpotLightHelper( focal1, 0.9);
    // const focal2Helper = new THREE.SpotLightHelper( focal2, 0.9 );
    // const focal3Helper = new THREE.SpotLightHelper( focal3, 0.9 );
    // scene.add( focal1Helper );
    // scene.add( focal2Helper );
    // scene.add( focal3Helper );
    scene.add(focal1);
    scene.add(focal2);
    scene.add(focal3);
}

function createSpotlight( color ) {

    const newObj = new THREE.SpotLight( color, 0.5 );
    // newObj.shadow.mapSize.width = 1024;  
    // newObj.shadow.mapSize.height = 1024;
    newObj.castShadow = true;
    newObj.angle = 0.6;
    newObj.penumbra = 0.3;
    newObj.decay = 2;
    //newObj.distance = 800;
    //newObj.angle= Math.PI/7;
    //newObj.shadow.camera.near = 800;
    newObj.shadow.camera.far = 4000;
    newObj.shadow.camera.fov = 30;
    return newObj;

}

function setCameras(ar){
    camera = new THREE.PerspectiveCamera( 70, ar, 0.01, 1900);
    camera.position.y = 340;
    camera.position.z = 200;
    //ayudante de camara
    cameraHelper = new THREE.CameraHelper(camera);
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
    switch (e.keyCode) {
        case 37:
        robot.position.x -= 10.0;
        break;
        case 38:
        robot.position.z -= 10.0;
        break;
        case 39:
        robot.position.x += 10.0;
        break;
        case 40:
        robot.position.z += 10.0;
        break;
      }
}

function loadScene()
{
    mundo  =  new Mundo();
    const sueloMaterial = new THREE.MeshNormalMaterial({wireframe:false, flatShading: true});
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000, 20,20), sueloMaterial );
    suelo.receiveShadow = true;
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.position.z= 0;
    scene.add(mundo.load());
    scene.add(suelo);
}

function update()
{
    angulo += 0.01;
    robot.rotation.y = angulo;
    
}

function render()
{
    requestAnimationFrame(render);
    TWEEN.update();
    renderer.clear();
    //update();
    renderer.render(scene,camera);

}