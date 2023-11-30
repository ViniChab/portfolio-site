import { Injectable } from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Subject } from 'rxjs';

const CAMERA_PARAMS = [75, window.innerWidth / window.innerHeight, 0.1, 1000];
const MODEL_PATH = '/assets/earth/earth.glb';
const WHITE = 0xffffff;
const INITIAL_ROTATION = Math.PI * 2; // One full rotation
const INITIAL_ROTATION_SPEED = 0.02;

@Injectable()
export class GlobeControllerService {
  public rotationFinishing$ = new Subject<boolean>();

  private isReturningToInitialPosition = false;
  private isInitialRotationComplete = false;
  private currentRotation = 0;

  private model!: THREE.Group;
  private renderer = new THREE.WebGLRenderer({ alpha: true });
  private scene = new THREE.Scene();
  private initialCameraPos = new THREE.Vector3();
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
          this.initialCameraPos.copy(this.camera.position);
          this.resizeModel();

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

  public animateModel() {
    requestAnimationFrame(this.animateModel.bind(this));

    if (this.isReturningToInitialPosition) {
      this.returnCameraToInitialPosition();
    }

    this.orbitControls.update();
    this.light.position.copy(this.camera.position);

    if (!this.isInitialRotationComplete && this.model) {
      if (INITIAL_ROTATION - this.currentRotation < 0.1) {
        this.rotationFinishing$.next(true);
      }

      if (INITIAL_ROTATION - this.currentRotation > 0.001) {
        let factor = (1 - this.currentRotation / INITIAL_ROTATION) * 5;
        this.model.rotateY(factor * INITIAL_ROTATION_SPEED);
        this.currentRotation += factor * INITIAL_ROTATION_SPEED;
      } else {
        this.isInitialRotationComplete = true;
        this.model.rotation.y = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  public listenToResize() {
    window.addEventListener('resize', () => this.resizeModel());
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

  private animateCameraReturn = () => {
    if (!this.isReturningToInitialPosition) return;

    const distance = this.camera.position.distanceTo(this.initialCameraPos);
    const direction = new THREE.Vector3()
      .subVectors(this.initialCameraPos, this.camera.position)
      .normalize();

    const angle = direction.angleTo(this.camera.position.clone().normalize());
    const lerpFactor = Math.max(distance / 50000, 0.0001);

    if (distance < 0.1) {
      this.isReturningToInitialPosition = false;
      this.camera.position.copy(this.initialCameraPos);
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
