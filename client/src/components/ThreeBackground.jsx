import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "../context/ThemeContext";

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { isDarkMode } = useTheme();

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
    const bgColor = isDarkMode ? 0x060814 : 0xf8fafc; // Ultra deep indigo black vs Soft light slate
    scene.fog = new THREE.FogExp2(bgColor, 0.0012);

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

    // 4. Generate Soft Cloud Node Texture Procedurally
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.7)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvas);

    // 5. Create Streaming Video Data Particles (Flowing forward)
    const streamGeo = new THREE.BufferGeometry();
    const streamCount = 1200;
    const streamPositions = new Float32Array(streamCount * 3);
    const streamColors = new Float32Array(streamCount * 3);
    const streamSpeeds = new Float32Array(streamCount);

    const colorRose = new THREE.Color(isDarkMode ? 0xff2a85 : 0xe11d48);
    const colorBlue = new THREE.Color(isDarkMode ? 0x3b82f6 : 0x2563eb);
    const colorPurple = new THREE.Color(isDarkMode ? 0x8b5cf6 : 0x7c3aed);
    const colorList = [colorRose, colorBlue, colorPurple];

    for (let i = 0; i < streamCount; i++) {
      // Concentric cylindrical tunnel distribution
      const angle = Math.random() * Math.PI * 2;
      const radius = 80 + Math.random() * 850;
      streamPositions[i * 3] = Math.cos(angle) * radius;
      streamPositions[i * 3 + 1] = Math.sin(angle) * radius;
      streamPositions[i * 3 + 2] = (Math.random() - 0.5) * 3000; // Deep Z spread

      // Assign random neon branding color
      const c = colorList[Math.floor(Math.random() * colorList.length)];
      streamColors[i * 3] = c.r;
      streamColors[i * 3 + 1] = c.g;
      streamColors[i * 3 + 2] = c.b;

      // Forward travel velocity
      streamSpeeds[i] = 4 + Math.random() * 12;
    }

    streamGeo.setAttribute("position", new THREE.BufferAttribute(streamPositions, 3));
    streamGeo.setAttribute("color", new THREE.BufferAttribute(streamColors, 3));

    const streamMat = new THREE.PointsMaterial({
      size: 8,
      map: particleTexture,
      transparent: true,
      opacity: isDarkMode ? 0.8 : 0.65,
      vertexColors: true,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const streamParticles = new THREE.Points(streamGeo, streamMat);
    scene.add(streamParticles);

    // 6. Create Holographic Floating 3D Play Icons
    const playGroups = [];
    const playShape = new THREE.Shape();
    // Center alignment pointing right (Play symbol)
    playShape.moveTo(-15, -20);
    playShape.lineTo(25, 0);
    playShape.lineTo(-15, 20);
    playShape.closePath();
    const playGeo = new THREE.ShapeGeometry(playShape);

    const playColorList = isDarkMode
      ? [0xff2a85, 0x3b82f6, 0x8b5cf6]
      : [0xe11d48, 0x2563eb, 0x7c3aed];

    for (let i = 0; i < 22; i++) {
      const group = new THREE.Group();
      const colorHex = playColorList[i % playColorList.length];

      // Holographic transparent face
      const meshMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isDarkMode ? 0.12 : 0.08,
        side: THREE.DoubleSide,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const mesh = new THREE.Mesh(playGeo, meshMat);
      group.add(mesh);

      // Glowing edge outlines
      const wireframeGeo = new THREE.EdgesGeometry(playGeo);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isDarkMode ? 0.35 : 0.25,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const line = new THREE.LineSegments(wireframeGeo, wireframeMat);
      group.add(line);

      // Spatial distribution
      group.position.x = (Math.random() - 0.5) * 1800;
      group.position.y = (Math.random() - 0.5) * 900;
      group.position.z = (Math.random() - 0.5) * 2000;

      // Random rotation
      group.rotation.x = Math.random() * Math.PI;
      group.rotation.y = Math.random() * Math.PI;
      group.rotation.z = Math.random() * Math.PI;

      group.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.012,
        rotSpeedY: (Math.random() - 0.5) * 0.012,
        rotSpeedZ: (Math.random() - 0.5) * 0.008,
        driftSpeedZ: 0.15 + Math.random() * 0.45,
      };

      scene.add(group);
      playGroups.push(group);
    }

    // 7. Interactive mouse parallax
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

    const animate = () => {
      // 8a. Animate neon data stream flow
      const positions = streamParticles.geometry.attributes.position.array;
      for (let i = 0; i < streamCount; i++) {
        positions[i * 3 + 2] += streamSpeeds[i];

        // Wrap around when it passes the camera viewport
        if (positions[i * 3 + 2] > 1000) {
          positions[i * 3 + 2] = -2000;
          const angle = Math.random() * Math.PI * 2;
          const radius = 80 + Math.random() * 850;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.sin(angle) * radius;
        }
      }
      streamParticles.geometry.attributes.position.needsUpdate = true;

      // 8b. Animate holographic play symbols
      playGroups.forEach((group) => {
        group.rotation.x += group.userData.rotSpeedX;
        group.rotation.y += group.userData.rotSpeedY;
        group.rotation.z += group.userData.rotSpeedZ;

        group.position.z += group.userData.driftSpeedZ;
        if (group.position.z > 1000) {
          group.position.z = -1500;
          group.position.x = (Math.random() - 0.5) * 1800;
          group.position.y = (Math.random() - 0.5) * 900;
        }
      });

      // 8c. Mouse Parallax interpolation
      camera.position.x += (mouseX * 0.45 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 0.45 - camera.position.y) * 0.05;
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

    // 10. Memory Cleanups (Prevention of GPU memory leaks)
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", onDocumentMouseMove);
      cancelAnimationFrame(animationFrameId);
      
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }

      streamGeo.dispose();
      streamMat.dispose();
      playGeo.dispose();
      particleTexture.dispose();
      
      playGroups.forEach((group) => {
        group.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });

      renderer.dispose();
    };
  }, [isDarkMode]);

  return <div ref={mountRef} className="three-background fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />;
}
