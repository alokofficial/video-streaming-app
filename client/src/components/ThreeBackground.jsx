import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "../context/ThemeContext";
import { useSiteGate } from "../context/SiteGateContext";

export default function ThreeBackground() {
  const mountRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { threeJsBackgroundEnabled } = useSiteGate();

  useEffect(() => {
    if (!threeJsBackgroundEnabled) return;

    const currentMount = mountRef.current;
    if (!currentMount) return;

    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;
    if (isSmallScreen) return;

    /* ─── 1. Core Setup ─── */
    const scene = new THREE.Scene();
    const bgColor = isDarkMode ? 0x030712 : 0xf0f4ff;
    scene.fog = new THREE.FogExp2(bgColor, isDarkMode ? 0.00065 : 0.0008);

    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      4000
    );
    camera.position.z = 800;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(bgColor);
    currentMount.appendChild(renderer.domElement);

    const clock = new THREE.Clock();

    /* ─── 2. Procedural Textures ─── */
    const makeGlowTexture = (size, softness) => {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(softness, "rgba(255,255,255,0.4)");
      g.addColorStop(0.7, "rgba(255,255,255,0.08)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    };

    const dotTex = makeGlowTexture(128, 0.15);
    const softTex = makeGlowTexture(64, 0.3);

    /* ─── 3. Color Palette ─── */
    const palette = isDarkMode
      ? {
          primary: new THREE.Color(0xff3366),
          secondary: new THREE.Color(0x4488ff),
          accent: new THREE.Color(0xaa55ff),
          cyan: new THREE.Color(0x00ddff),
          warm: new THREE.Color(0xff8844),
        }
      : {
          primary: new THREE.Color(0xe11d48),
          secondary: new THREE.Color(0x2563eb),
          accent: new THREE.Color(0x7c3aed),
          cyan: new THREE.Color(0x0891b2),
          warm: new THREE.Color(0xea580c),
        };
    const colorArr = [
      palette.primary,
      palette.secondary,
      palette.accent,
      palette.cyan,
      palette.warm,
    ];

    /* ─── 4. Neural Particle Cloud ─── */
    const PARTICLE_COUNT = 900;
    const neuralGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(PARTICLE_COUNT * 3);
    const nCol = new Float32Array(PARTICLE_COUNT * 3);
    const nSize = new Float32Array(PARTICLE_COUNT);
    const nVel = []; // velocity per particle
    const nBase = []; // original resting position

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 2400;
      const y = (Math.random() - 0.5) * 1400;
      const z = (Math.random() - 0.5) * 2000;
      nPos[i * 3] = x;
      nPos[i * 3 + 1] = y;
      nPos[i * 3 + 2] = z;
      nBase.push(new THREE.Vector3(x, y, z));

      const c = colorArr[Math.floor(Math.random() * colorArr.length)];
      nCol[i * 3] = c.r;
      nCol[i * 3 + 1] = c.g;
      nCol[i * 3 + 2] = c.b;

      nSize[i] = 3 + Math.random() * 6;

      nVel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.15
        )
      );
    }

    neuralGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
    neuralGeo.setAttribute("color", new THREE.BufferAttribute(nCol, 3));
    neuralGeo.setAttribute("size", new THREE.BufferAttribute(nSize, 1));

    const neuralMat = new THREE.PointsMaterial({
      size: 5,
      map: dotTex,
      transparent: true,
      opacity: isDarkMode ? 0.85 : 0.55,
      vertexColors: true,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const neuralParticles = new THREE.Points(neuralGeo, neuralMat);
    scene.add(neuralParticles);

    /* ─── 5. Dynamic Connection Lines ─── */
    const MAX_CONNECTIONS = 600;
    const CONNECTION_DIST = 180;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6); // 2 points × 3
    const lineColors = new Float32Array(MAX_CONNECTIONS * 6);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
    lineGeo.setDrawRange(0, 0);

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDarkMode ? 0.25 : 0.12,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(connectionLines);

    /* ─── 6. Floating Geometric Wireframes ─── */
    const geoShapes = [];
    const geometries = [
      new THREE.IcosahedronGeometry(40, 1),
      new THREE.OctahedronGeometry(35, 0),
      new THREE.TetrahedronGeometry(30, 0),
      new THREE.TorusGeometry(28, 8, 8, 6),
      new THREE.DodecahedronGeometry(32, 0),
    ];

    for (let i = 0; i < 12; i++) {
      const geo = geometries[i % geometries.length];
      const colorHex = colorArr[i % colorArr.length];

      const edgesGeo = new THREE.EdgesGeometry(geo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isDarkMode ? 0.22 : 0.14,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);

      // Translucent faces
      const faceMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isDarkMode ? 0.04 : 0.03,
        side: THREE.DoubleSide,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const faceMesh = new THREE.Mesh(geo, faceMat);

      const group = new THREE.Group();
      group.add(wireframe);
      group.add(faceMesh);

      group.position.set(
        (Math.random() - 0.5) * 2200,
        (Math.random() - 0.5) * 1200,
        (Math.random() - 0.5) * 1800
      );

      const scale = 0.8 + Math.random() * 1.5;
      group.scale.setScalar(scale);

      group.userData = {
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.008,
          (Math.random() - 0.5) * 0.004
        ),
        floatOffset: Math.random() * Math.PI * 2,
        floatAmp: 15 + Math.random() * 35,
        floatFreq: 0.3 + Math.random() * 0.5,
        baseY: group.position.y,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        edgesMat,
        faceMat,
      };

      scene.add(group);
      geoShapes.push(group);
    }

    /* ─── 7. Ambient Stardust Layer ─── */
    const dustCount = 500;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 3500;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 3000;

      const brightness = isDarkMode ? 0.3 + Math.random() * 0.4 : 0.4 + Math.random() * 0.3;
      dustCol[i * 3] = brightness;
      dustCol[i * 3 + 1] = brightness;
      dustCol[i * 3 + 2] = brightness;
    }

    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 2,
      map: softTex,
      transparent: true,
      opacity: isDarkMode ? 0.5 : 0.3,
      vertexColors: true,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    /* ─── 8. Orbiting Ring of Particles ─── */
    const RING_COUNT = 200;
    const ringGeo = new THREE.BufferGeometry();
    const ringPos = new Float32Array(RING_COUNT * 3);
    const ringCol = new Float32Array(RING_COUNT * 3);
    const ringAngles = new Float32Array(RING_COUNT);
    const ringRadii = new Float32Array(RING_COUNT);
    const ringYOffsets = new Float32Array(RING_COUNT);
    const ringSpeeds = new Float32Array(RING_COUNT);

    for (let i = 0; i < RING_COUNT; i++) {
      ringAngles[i] = (i / RING_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      ringRadii[i] = 550 + (Math.random() - 0.5) * 120;
      ringYOffsets[i] = (Math.random() - 0.5) * 60;
      ringSpeeds[i] = 0.1 + Math.random() * 0.15;

      const c = colorArr[i % colorArr.length];
      ringCol[i * 3] = c.r;
      ringCol[i * 3 + 1] = c.g;
      ringCol[i * 3 + 2] = c.b;
    }

    ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    ringGeo.setAttribute("color", new THREE.BufferAttribute(ringCol, 3));

    const ringMat = new THREE.PointsMaterial({
      size: 4,
      map: dotTex,
      transparent: true,
      opacity: isDarkMode ? 0.7 : 0.4,
      vertexColors: true,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const ringParticles = new THREE.Points(ringGeo, ringMat);
    ringParticles.rotation.x = Math.PI * 0.15;
    scene.add(ringParticles);

    /* ─── 9. Mouse Interaction ─── */
    let mouseX = 0;
    let mouseY = 0;
    let mouseWorldX = 0;
    let mouseWorldY = 0;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;

    const onMouseMove = (e) => {
      mouseX = e.clientX - halfW;
      mouseY = e.clientY - halfH;

      // Project to world space for particle interaction
      const ndc = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      mouseWorldX = ndc.x * 1200;
      mouseWorldY = ndc.y * 700;
    };
    document.addEventListener("mousemove", onMouseMove);

    /* ─── 10. Animation Loop ─── */
    let animId;

    const animate = () => {
      const t = clock.getElapsedTime();
      const positions = neuralGeo.attributes.position.array;

      /* 10a – Neural particle drift + mouse repulsion */
      const MOUSE_RADIUS = 250;
      const MOUSE_FORCE = 40;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        // Organic drift
        positions[ix] += nVel[i].x;
        positions[iy] += nVel[i].y;
        positions[iz] += nVel[i].z;

        // Gentle spring back to base
        const dx = nBase[i].x - positions[ix];
        const dy = nBase[i].y - positions[iy];
        const dz = nBase[i].z - positions[iz];
        positions[ix] += dx * 0.003;
        positions[iy] += dy * 0.003;
        positions[iz] += dz * 0.003;

        // Breathing motion
        positions[iy] += Math.sin(t * 0.5 + i * 0.1) * 0.15;

        // Mouse repulsion (interactive push)
        const mDx = positions[ix] - mouseWorldX;
        const mDy = positions[iy] - mouseWorldY;
        const mDist = Math.sqrt(mDx * mDx + mDy * mDy);

        if (mDist < MOUSE_RADIUS && mDist > 0.1) {
          const force = (1 - mDist / MOUSE_RADIUS) * MOUSE_FORCE;
          positions[ix] += (mDx / mDist) * force * 0.15;
          positions[iy] += (mDy / mDist) * force * 0.15;
        }

        // Wrap boundaries gently
        if (positions[ix] > 1300) positions[ix] = -1300;
        if (positions[ix] < -1300) positions[ix] = 1300;
        if (positions[iy] > 800) positions[iy] = -800;
        if (positions[iy] < -800) positions[iy] = 800;
      }
      neuralGeo.attributes.position.needsUpdate = true;

      /* 10b – Dynamic connections */
      let lineIdx = 0;
      const lp = lineGeo.attributes.position.array;
      const lc = lineGeo.attributes.color.array;

      // Only check subset for perf (grid spatial hash approximation)
      for (let i = 0; i < PARTICLE_COUNT && lineIdx < MAX_CONNECTIONS; i += 2) {
        for (
          let j = i + 1;
          j < Math.min(i + 40, PARTICLE_COUNT) && lineIdx < MAX_CONNECTIONS;
          j += 2
        ) {
          const ix = i * 3;
          const jx = j * 3;
          const ddx = positions[ix] - positions[jx];
          const ddy = positions[ix + 1] - positions[jx + 1];
          const ddz = positions[ix + 2] - positions[jx + 2];
          const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);

          if (dist < CONNECTION_DIST) {
            const li = lineIdx * 6;
            lp[li] = positions[ix];
            lp[li + 1] = positions[ix + 1];
            lp[li + 2] = positions[ix + 2];
            lp[li + 3] = positions[jx];
            lp[li + 4] = positions[jx + 1];
            lp[li + 5] = positions[jx + 2];

            const alpha = 1 - dist / CONNECTION_DIST;
            const cr = nCol[ix] * alpha;
            const cg = nCol[ix + 1] * alpha;
            const cb = nCol[ix + 2] * alpha;
            lc[li] = cr;
            lc[li + 1] = cg;
            lc[li + 2] = cb;
            lc[li + 3] = cr;
            lc[li + 4] = cg;
            lc[li + 5] = cb;

            lineIdx++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate = true;

      /* 10c – Geometric shapes: rotate, float, pulse */
      geoShapes.forEach((group) => {
        const ud = group.userData;
        group.rotation.x += ud.rotSpeed.x;
        group.rotation.y += ud.rotSpeed.y;
        group.rotation.z += ud.rotSpeed.z;

        // Floating bob
        group.position.y =
          ud.baseY + Math.sin(t * ud.floatFreq + ud.floatOffset) * ud.floatAmp;

        // Pulsing opacity
        const pulse = 0.5 + 0.5 * Math.sin(t * ud.pulseSpeed + ud.floatOffset);
        ud.edgesMat.opacity = (isDarkMode ? 0.15 : 0.08) + pulse * (isDarkMode ? 0.18 : 0.1);
        ud.faceMat.opacity = (isDarkMode ? 0.02 : 0.01) + pulse * (isDarkMode ? 0.04 : 0.025);

        // Breathing scale
        const breathe = 1 + Math.sin(t * 0.6 + ud.floatOffset) * 0.08;
        group.scale.setScalar(
          group.scale.x > 2
            ? group.scale.x
            : ((group.scale.x / breathe) * (1 + Math.sin(t * 0.6 + ud.floatOffset) * 0.08))
        );
      });

      /* 10d – Stardust gentle twinkle */
      const dustPositions = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.05;
        dustPositions[i * 3] += Math.cos(t * 0.2 + i * 0.7) * 0.03;
      }
      dustGeo.attributes.position.needsUpdate = true;

      /* 10e – Orbiting ring */
      const rp = ringGeo.attributes.position.array;
      for (let i = 0; i < RING_COUNT; i++) {
        ringAngles[i] += ringSpeeds[i] * 0.004;
        const a = ringAngles[i];
        const r = ringRadii[i] + Math.sin(t * 0.8 + i) * 20;
        rp[i * 3] = Math.cos(a) * r;
        rp[i * 3 + 1] = ringYOffsets[i] + Math.sin(t * 0.5 + i * 0.5) * 15;
        rp[i * 3 + 2] = Math.sin(a) * r;
      }
      ringGeo.attributes.position.needsUpdate = true;
      ringParticles.rotation.y += 0.0003;

      /* 10f – Camera parallax */
      camera.position.x += (mouseX * 0.35 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.35 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    /* ─── 11. Resize ─── */
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    /* ─── 12. Cleanup ─── */
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);

      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }

      // Dispose particles
      neuralGeo.dispose();
      neuralMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      dotTex.dispose();
      softTex.dispose();

      // Dispose shapes
      geometries.forEach((g) => g.dispose());
      geoShapes.forEach((group) => {
        group.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });

      renderer.dispose();
    };
  }, [isDarkMode, threeJsBackgroundEnabled]);

  if (!threeJsBackgroundEnabled) return null;

  return (
    <div
      ref={mountRef}
      className="three-background fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
