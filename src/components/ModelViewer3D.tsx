import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ModelViewer3DProps {
  modelPath: string;
  className?: string;
}

const ModelViewer3D = ({ modelPath, className = "" }: ModelViewer3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const timerRef = useRef<NodeJS.Timeout>();

  const startInstructionsTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Set new timer
    timerRef.current = setTimeout(() => {
      setShowInstructions(false);
    }, 10000);
  };

  useEffect(() => {
    if (!containerRef.current) return;

    startInstructionsTimer();

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
    camera.position.y = 0;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Enable transparency
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true; // Enable zoom
    controls.minDistance = 1; // Set minimum zoom distance
    controls.maxDistance = 10; // Set maximum zoom distance
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xc054ff, 2);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0x5271ff, 2);
    directionalLight3.position.set(0, 1, -1);
    scene.add(directionalLight3);

    // Load 3D model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        // Center the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        gltf.scene.position.x -= center.x;
        gltf.scene.position.y -= center.y;
        gltf.scene.position.z -= center.z;

        // Scale the model to fit nicely in view
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        gltf.scene.scale.set(scale, scale, scale);

        // Adjust model position
        gltf.scene.position.y -= -0.5; // Reset any previous adjustment
        gltf.scene.rotation.y = Math.PI * 0.01; // Slight rotation for better view

        scene.add(gltf.scene);
      },
      (xhr) => {
        // Loading progress
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      controls.dispose();
    };
  }, [modelPath]);

  const toggleInstructions = () => {
    setShowInstructions((prev) => !prev);
    if (!showInstructions) {
      startInstructionsTimer();
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className={`w-full h-full ${className}`} />

      {/* Info button */}
      <button
        onClick={toggleInstructions}
        className="absolute bottom-4 right-4 w-8 h-8 bg-black/80 hover:bg-black/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
        title="Toggle navigation instructions"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-5 h-5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {showInstructions && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm text-sm max-w-xs space-y-2 transition-opacity duration-300">
          <button
            onClick={() => setShowInstructions(false)}
            className="absolute top-2 right-2 text-white/60 hover:text-white"
          >
            ×
          </button>
          <h3 className="font-semibold mb-2">Navigation Controls:</h3>
          <ul className="space-y-1 text-white/90">
            <li>🖱️ Left Click + Drag: Rotate model</li>
            <li>🖱️ Scroll Wheel: Zoom in/out</li>
            <li>🖱️ Right Click + Drag: Pan view</li>
          </ul>
          <p className="text-xs text-white/60 mt-2">
            These instructions will auto-hide in 10 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelViewer3D;
