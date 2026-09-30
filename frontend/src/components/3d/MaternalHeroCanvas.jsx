import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MaternalHeroCanvas({ height = 340, interactive = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const h = height;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group for entire 3D rig
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Core Sphere — Soft nurturing glow
    const coreGeometry = new THREE.SphereGeometry(1.4, 64, 64);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f7a7c8'),
      emissive: new THREE.Color('#9b72cf'),
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65, // glass/gel look
      thickness: 1.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const coreSphere = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreSphere);

    // 2. Inner Heart/Embryo pulsating sphere
    const innerGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ff6590'),
      emissive: new THREE.Color('#ff4070'),
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    const innerHeart = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerHeart);

    // 3. Orbiting Protection Rings (representing maternal embrace & trimesters)
    const ring1Geo = new THREE.TorusGeometry(2.1, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8639a'),
      emissive: new THREE.Color('#e8639a'),
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    group.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.35, 0.025, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#b48dd8'),
      emissive: new THREE.Color('#9b72cf'),
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    group.add(ring2);

    // 4. Stardust / Blessing Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.4 + Math.random() * 1.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      scales[i] = Math.random() * 0.08 + 0.02;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color('#fcdde8'),
      size: 0.07,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffebf3, 2.5);
    keyLight.position.set(5, 6, 7);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xb48dd8, 3, 20);
    fillLight.position.set(-6, -3, 3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xff6da0, 4, 15);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.6;
      targetY = y * 0.4;
    };

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    // Animation loop
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Soft breathing pulse (simulating fetal heartbeat & maternal life rhythm)
      const heartbeat = Math.sin(elapsed * 4.2);
      const pulseScale = 1 + (heartbeat > 0.4 ? Math.sin(elapsed * 12) * 0.06 : 0);
      innerHeart.scale.set(pulseScale, pulseScale, pulseScale);
      coreSphere.scale.set(1 + Math.sin(elapsed * 1.5) * 0.02, 1 + Math.sin(elapsed * 1.5) * 0.02, 1 + Math.sin(elapsed * 1.5) * 0.02);

      // Smooth organic rotation
      group.rotation.y = elapsed * 0.35 + mouseX;
      group.rotation.x = Math.sin(elapsed * 0.25) * 0.15 + mouseY;
      ring1.rotation.z = elapsed * 0.4;
      ring2.rotation.y = -elapsed * 0.3;
      particles.rotation.y = elapsed * 0.08;

      // Mouse damping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (interactive && container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [height, interactive]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: interactive ? 'grab' : 'default',
        userSelect: 'none',
      }}
    />
  );
}
