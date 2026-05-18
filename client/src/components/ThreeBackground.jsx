import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const isSmallScreen = window.matchMedia(
      "(max-width: 767px)"
    ).matches;

    if (isSmallScreen) {
      return;
    }

    // 1. Setup Scene
    const scene = new THREE.Scene();
    const bgColor = 0x0a0c19; // Deep twilight blue
    scene.fog = new THREE.FogExp2(bgColor, 0.001);

    // 2. Setup Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.5)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(bgColor);
    currentMount.appendChild(renderer.domElement);

    // 4. Generate Soft Cloud Texture Procedurally
    // Using a canvas to create a smooth radial gradient so we don't need to load external images
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    const cloudTexture = new THREE.CanvasTexture(canvas);

    // 5. Create Cloud Particle System
    const cloudGeo = new THREE.BufferGeometry();
    const cloudCount = 600;
    const posArray = new Float32Array(cloudCount * 3);
    const colorsArray = new Float32Array(cloudCount * 3);

    // Cloud colors: Moody dark purples and blues to match a dark theme
    const color1 = new THREE.Color(0x1e2749); // Dark blueish
    const color2 = new THREE.Color(0x271933); // Dark purple
    const color3 = new THREE.Color(0x141829); // Almost black-blue

    for (let i = 0; i < cloudCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 3500;     // X spread
      posArray[i + 1] = (Math.random() - 0.5) * 1500; // Y spread
      posArray[i + 2] = (Math.random() - 0.5) * 2500; // Z spread

      const rand = Math.random();
      let c = color1;
      if (rand > 0.66) c = color2;
      else if (rand > 0.33) c = color3;

      colorsArray[i] = c.r;
      colorsArray[i + 1] = c.g;
      colorsArray[i + 2] = c.b;
    }

    cloudGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    cloudGeo.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

    const cloudMat = new THREE.PointsMaterial({
      size: 500, // Very large puffs
      map: cloudTexture,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const cloudParticles = new THREE.Points(cloudGeo, cloudMat);
    scene.add(cloudParticles);

    // 6. Add subtle dust/stars in the background
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 400;
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starsPos[i] = (Math.random() - 0.5) * 3000;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x88aaff,
      size: 2,
      transparent: true,
      opacity: 0.4,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);

    // 7. Interaction Variables
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    };

    document.addEventListener("mousemove", onDocumentMouseMove);

    // 8. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = clock.getElapsedTime();

      // Slowly rotate the entire cloud field to simulate floating
      cloudParticles.rotation.y = time * 0.02;
      cloudParticles.rotation.z = time * 0.005;
      
      // Slowly rotate stars in the opposite direction
      stars.rotation.y = time * -0.01;

      // Parallax effect: Camera follows mouse slightly for depth
      camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.6 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 10. Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", onDocumentMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      cloudGeo.dispose();
      cloudMat.dispose();
      cloudTexture.dispose();
      starsGeo.dispose();
      starsMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />;
}
