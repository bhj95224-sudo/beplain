import * as THREE from "./assets/3d/vendor/three.module.js";
import { createBeplainTubeModel } from "./assets/3d/models/tube-model.js";
import { createProduct } from "./assets/3d/models/products.js";

const MODEL_TILT_DEGREES = 40;
const MODEL_SPIN_DURATION_MS = 10000;
const SLIDE_TRANSITION_MS = 900;
const MODEL_FRAME_FILL = 0.9;
const MODEL_SPIN_SAMPLE_DEGREES = [0, 45, 90, 135, 180, 225, 270, 315];
const MAX_PIXEL_RATIO = 1.75;

class ProductModelViewer {
  constructor(host) {
    this.host = host;
    this.productId = host.dataset.productId;
    this.spinAnimationFrame = 0;
    this.spinStopTimer = 0;
    this.previousSpinTime = 0;
    this.model = null;
    this.modelPivot = null;
    this.renderer = null;
    this.camera = null;
    this.scene = null;
    this.frameBounds = null;
    this.modelHeight = 0;
    this.resizeObserver = null;
    this.isReady = false;
  }

  init() {
    if (this.isReady) return true;

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.NeutralToneMapping;
      this.renderer.toneMappingExposure = 0.95;
      this.renderer.domElement.setAttribute("aria-hidden", "true");

      this.scene = new THREE.Scene();
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x90a36f, 2.3));

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
      keyLight.position.set(-6, 14, 12);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xdce9ff, 1.4);
      fillLight.position.set(8, 8, 7);
      this.scene.add(fillLight);

      this.model = this.productId === "tube"
        ? createBeplainTubeModel({ anisotropy: this.renderer.capabilities.getMaxAnisotropy() })
        : createProduct(this.productId, { anisotropy: this.renderer.capabilities.getMaxAnisotropy() });
      this.modelHeight = this.model.userData.bounds.height;
      this.model.position.y = this.modelHeight * -0.5;

      this.modelPivot = new THREE.Group();
      this.modelPivot.position.y = this.modelHeight * 0.5;
      this.modelPivot.rotation.z = THREE.MathUtils.degToRad(MODEL_TILT_DEGREES);
      this.modelPivot.add(this.model);
      this.scene.add(this.modelPivot);
      this.frameBounds = this.measureFrameBounds();

      this.camera = new THREE.PerspectiveCamera(12, 1, 0.1, this.modelHeight * 20);
      this.camera.position.set(0, this.modelHeight * 0.5, this.modelHeight * 5.2);
      this.camera.lookAt(0, this.modelHeight * 0.5, 0);

      this.host.querySelector(".product_model_status")?.remove();
      this.host.appendChild(this.renderer.domElement);
      this.host.classList.add("is_ready");
      this.isReady = true;

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);
      this.resize();
      return true;
    } catch (error) {
      this.showError();
      return false;
    }
  }

  resize() {
    if (!this.isReady) return;
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.fitModelToFrame();
    this.render();
  }

  measureFrameBounds() {
    const previousSpin = this.model.rotation.y;
    const bounds = { width: 0, height: 0 };

    MODEL_SPIN_SAMPLE_DEGREES.forEach((rotationDegrees) => {
      this.model.rotation.y = THREE.MathUtils.degToRad(rotationDegrees);
      this.modelPivot.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(this.modelPivot).getSize(new THREE.Vector3());
      bounds.width = Math.max(bounds.width, size.x);
      bounds.height = Math.max(bounds.height, size.y);
    });

    this.model.rotation.y = previousSpin;
    this.modelPivot.updateMatrixWorld(true);
    return bounds;
  }

  fitModelToFrame() {
    const cameraDistance = this.camera.position.z;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const frameHeight = 2 * cameraDistance * Math.tan(verticalFov * 0.5);
    const frameWidth = frameHeight * this.camera.aspect;
    const scale = Math.min(
      1,
      (frameWidth * MODEL_FRAME_FILL) / this.frameBounds.width,
      (frameHeight * MODEL_FRAME_FILL) / this.frameBounds.height
    );

    this.modelPivot.scale.setScalar(scale);
    this.modelPivot.updateMatrixWorld(true);
  }

  render() {
    if (!this.isReady) return;
    this.renderer.render(this.scene, this.camera);
  }

  startSpin(shouldReduceMotion) {
    if (!this.init()) return;
    window.clearTimeout(this.spinStopTimer);
    this.spinStopTimer = 0;

    if (shouldReduceMotion || this.spinAnimationFrame) {
      this.render();
      return;
    }

    this.previousSpinTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = Math.min(64, currentTime - this.previousSpinTime);
      this.previousSpinTime = currentTime;
      this.model.rotation.y = (this.model.rotation.y + (Math.PI * 2 * elapsed) / MODEL_SPIN_DURATION_MS) % (Math.PI * 2);
      this.render();
      this.spinAnimationFrame = window.requestAnimationFrame(animate);
    };

    this.spinAnimationFrame = window.requestAnimationFrame(animate);
  }

  stopSpin(delay = 0) {
    window.clearTimeout(this.spinStopTimer);

    const stop = () => {
      window.cancelAnimationFrame(this.spinAnimationFrame);
      this.spinAnimationFrame = 0;
      this.previousSpinTime = 0;
      this.spinStopTimer = 0;
    };

    if (delay > 0) {
      this.spinStopTimer = window.setTimeout(stop, delay);
    } else {
      stop();
    }
  }

  showError() {
    this.host.classList.add("has_error");
    const status = this.host.querySelector(".product_model_status");
    if (status) status.textContent = "3D 제품을 표시할 수 없습니다";
  }
}

export function initProductModels() {
  const viewers = new Map();
  const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getViewer(host) {
    if (!host) return null;
    if (!viewers.has(host)) viewers.set(host, new ProductModelViewer(host));
    return viewers.get(host);
  }

  const activeHost = document.querySelector(".carousel_slide.is_active .product_model");
  getViewer(activeHost)?.startSpin(shouldReduceMotion);

  return {
    spinSlides(previousSlide, currentSlide) {
      const previousHost = previousSlide.querySelector(".product_model");
      const currentHost = currentSlide.querySelector(".product_model");

      if (previousHost) {
        const previousViewer = getViewer(previousHost);
        previousViewer?.startSpin(shouldReduceMotion);
        previousViewer?.stopSpin(SLIDE_TRANSITION_MS);
      }

      if (currentHost) getViewer(currentHost)?.startSpin(shouldReduceMotion);
    },
  };
}
