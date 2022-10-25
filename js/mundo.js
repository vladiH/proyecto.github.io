import * as THREE from "../lib/three.module.js";
class Mundo{
    constructor(){
        this.radius = 1;
    }

    load(){
        const material = new THREE.MeshNormalMaterial({wireframe:true});
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(this.radius,10,10), material);
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.position.x = 0;
        mesh.position.y = 0;
        mesh.position.z = 0;

        return mesh;
    }
}
export {Mundo}