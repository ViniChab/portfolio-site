import { Injectable } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const CAMERA_PARAMS = [75, window.innerWidth / window.innerHeight, 0.1, 1000];
const MODEL_PATH = '/assets/earth/earth.glb';
const WHITE = 0xffffff;

@Injectable()
export class GlobeControllerService {
  private model!: THREE.Group;
  private isReturningToInitialPosition = false;

  private renderer = new THREE.WebGLRenderer({ alpha: true });
  private scene = new THREE.Scene();
  private initialCameraPosition = new THREE.Vector3();
  private camera = new THREE.PerspectiveCamera(...CAMERA_PARAMS);
  private light = new THREE.DirectionalLight(WHITE, 3);
  private orbitControls = new OrbitControls(
    this.camera,
    this.renderer.domElement
  );

  public loadModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        MODEL_PATH,
        (gltf) => {
          this.model = gltf.scene;
          this.model.position.set(0, 0, 0);
          this.model.scale.set(2.8, 2.8, 2.8);
          this.model.rotateY(-1);
          this.resizeModel();
          this.initialCameraPosition.copy(this.camera.position);

          this.scene.add(this.model);
          resolve(undefined);
        },
        undefined,
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  public prepareRenderer(canvasContainer: HTMLElement) {
    this.camera.updateProjectionMatrix();

    this.scene.background = null;
    this.camera.position.z = 5;
    canvasContainer.appendChild(this.renderer.domElement);
  }

  public returnCameraToInitialPosition() {
    this.isReturningToInitialPosition = true;
    requestAnimationFrame(this.animateCameraReturn);
  }

  public addLight() {
    this.light.position.set(-1, 2, 4);
    this.light.castShadow = true;
    this.scene.add(this.light);
  }

  public setOrbitControls() {
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.02;
    this.orbitControls.rotateSpeed = 0.2;

    this.orbitControls.enableZoom = false;

    this.orbitControls.addEventListener('start', () => {
      this.isReturningToInitialPosition = false;
    });

    this.orbitControls.addEventListener('end', () => {
      this.isReturningToInitialPosition = true;
    });
  }

  /**
   * A bit arbitrary but fine-tuned values to make the model fit the screen in a comfortable way.
   **/
  private resizeModel() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let newSize: number;

    if (windowWidth < windowHeight) {
      newSize = windowWidth < 600 ? windowWidth / 1.2 : windowWidth / 1.5;
    } else {
      newSize = windowHeight * 0.5;
    }

    const canvasSize = { width: newSize, height: newSize };
    this.renderer.setSize(canvasSize.width, canvasSize.height);
    this.camera.aspect = canvasSize.width / canvasSize.height;
    this.camera.updateProjectionMatrix();
  }

  public animateModel = () => {
    requestAnimationFrame(this.animateModel);

    if (this.isReturningToInitialPosition) {
      this.returnCameraToInitialPosition();
    }

    this.orbitControls.update();
    this.light.position.copy(this.camera.position);

    this.renderer.render(this.scene, this.camera);

    if (this.model?.rotation?.y < 0.1) {
      this.model.rotateY(0.1);
    }
  };

  public listenToResize() {
    window.addEventListener('resize', () => this.resizeModel());
  }

  private animateCameraReturn = () => {
    if (!this.isReturningToInitialPosition) return;

    const lerpFactor = 0.00015;

    const direction = new THREE.Vector3()
      .subVectors(this.initialCameraPosition, this.camera.position)
      .normalize();

    const angle = direction.angleTo(this.camera.position.clone().normalize());

    if (angle < 1.6) {
      this.isReturningToInitialPosition = false;
      return;
    }

    const newPosition = {
      x: -this.camera.position.x,
      y: -this.camera.position.y,
      z: -this.camera.position.z,
    };

    this.camera.position.applyAxisAngle(
      direction.cross(newPosition as THREE.Vector3),
      angle * lerpFactor
    );

    requestAnimationFrame(this.animateCameraReturn);

    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
