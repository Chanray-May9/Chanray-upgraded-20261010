/* Three.js pastel background: drifting petals + glassy torus knot. */
export function initBg3d() {
  if (!window.THREE) return;
  const canvas = document.querySelector("#bg3d");
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  cam.position.z = 14;

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const pl = new THREE.PointLight(0xffb3d1, 2, 60);
  pl.position.set(5, 6, 8);
  scene.add(pl);

  const petalGeo = new THREE.SphereGeometry(0.22, 8, 6);
  petalGeo.scale(1, 0.35, 0.7);
  const colors = [0xffb3d1, 0xffd6a5, 0xa5d8ff, 0xcdb4f6, 0xffc8dd];
  const petals = [];
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(
      petalGeo,
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.5, transparent: true, opacity: 0.85 })
    );
    m.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12);
    m.userData = { vy: 0.006 + Math.random() * 0.012, vr: (Math.random() - 0.5) * 0.03, sway: Math.random() * Math.PI * 2 };
    scene.add(m);
    petals.push(m);
  }

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(2.2, 0.5, 140, 20),
    new THREE.MeshPhysicalMaterial({ color: 0xffc2d9, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.35, transmission: 0.6 })
  );
  knot.position.set(6, 1.5, -4);
  scene.add(knot);

  let mx = 0, my = 0;
  addEventListener("pointermove", (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  resize();

  let t = 0;
  (function loop() {
    t += 0.01;
    for (const p of petals) {
      p.position.y -= p.userData.vy;
      p.position.x += Math.sin(t + p.userData.sway) * 0.004;
      p.rotation.x += p.userData.vr;
      p.rotation.z += p.userData.vr;
      if (p.position.y < -12) p.position.y = 12;
    }
    knot.rotation.x = t * 0.3;
    knot.rotation.y = t * 0.2;
    cam.position.x += (mx * 1.2 - cam.position.x) * 0.03;
    cam.position.y += (-my * 0.8 - cam.position.y) * 0.03;
    cam.lookAt(0, 0, 0);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
}
