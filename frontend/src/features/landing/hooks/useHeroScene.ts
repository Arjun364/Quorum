import { prefersReducedMotion } from '@/shared';
import { useEffect } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { BLOB_FRAGMENT_LINES, BLOB_FRAGMENT_SOLID, BLOB_VERTEX } from '../constants';

/**
 * Builds the hero's 3D object inside `container`: a dark blob whose surface flows with noise, drawn again as glowing
 * lines. The pointer bends it: the blob turns toward the mouse, swells where the mouse is, and gets livelier the
 * faster the mouse moves. Pauses off screen; one still frame under reduced motion. Returns nothing; when WebGL
 * is unavailable the child marked data-fallback stays visible.
 */
export function useHeroScene(container: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const fallback = host.querySelector<HTMLElement>('[data-fallback]');

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return;
    }
    const reduced = prefersReducedMotion();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(renderer.domElement);
    if (fallback) fallback.style.opacity = '0';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.z = 3.9;

    const readAccent = (): THREE.Color => {
      const value = getComputedStyle(host).getPropertyValue('--accent').trim();
      return new THREE.Color(/^#[0-9a-f]{6}$/i.test(value) ? value : '#5ab9fc');
    };
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 1) },
      uEnergy: { value: 0.35 },
      uColor: { value: readAccent() },
    };
    const solidMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: BLOB_VERTEX, fragmentShader: BLOB_FRAGMENT_SOLID });
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: BLOB_VERTEX,
      fragmentShader: BLOB_FRAGMENT_LINES,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    solidMaterial.polygonOffset = true;
    solidMaterial.polygonOffsetFactor = 1;
    solidMaterial.polygonOffsetUnits = 1;
    const group = new THREE.Group();
    const solid = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 24), solidMaterial);
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 9)), lineMaterial);
    group.add(solid, lines);
    scene.add(group);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, speed: 0, lastX: 0, lastY: 0 };
    const turn = { x: 0, y: 0 };
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let accentTimer = 0;

    const resize = (): void => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onMove = (event: PointerEvent): void => {
      const box = host.getBoundingClientRect();
      const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
      const ny = -(((event.clientY - box.top) / box.height) * 2 - 1);
      pointer.tx = Math.max(-1.4, Math.min(1.4, nx));
      pointer.ty = Math.max(-1.4, Math.min(1.4, ny));
      pointer.speed = Math.min(1, pointer.speed + Math.hypot(event.movementX, event.movementY) / 120);
    };

    const render = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pointer.x += (pointer.tx - pointer.x) * 0.07;
      pointer.y += (pointer.ty - pointer.y) * 0.07;
      pointer.speed *= 0.95;
      turn.x += (pointer.y * 0.55 - turn.x) * 0.05;
      turn.y += (pointer.x * 0.75 - turn.y) * 0.05;
      group.rotation.x = -turn.x;
      group.rotation.y = turn.y + now * 0.00006;
      uniforms.uTime.value += dt * (1 + pointer.speed * 2.5);
      uniforms.uEnergy.value += (0.35 + pointer.speed * 0.9 - uniforms.uEnergy.value) * 0.06;
      uniforms.uPointer.value.set(pointer.x, pointer.y, 1.1).applyEuler(new THREE.Euler(turn.x, -turn.y, 0));
      renderer.render(scene, camera);
    };
    const loop = (now: number): void => {
      if (visible) render(now);
      frame = requestAnimationFrame(loop);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    visibility.observe(host);

    if (reduced) {
      uniforms.uTime.value = 3;
      render(performance.now());
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      accentTimer = window.setInterval(() => {
        uniforms.uColor.value = readAccent();
      }, 2000);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(accentTimer);
      window.removeEventListener('pointermove', onMove);
      resizeObserver.disconnect();
      visibility.disconnect();
      solid.geometry.dispose();
      lines.geometry.dispose();
      solidMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (fallback) fallback.style.opacity = '1';
    };
  }, [container]);
}