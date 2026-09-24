'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface StockBin {
  locationName: string;
  itemName: string;
  itemSku?: string;
  physicalQty: number;
  reservedQty: number;
  batch?: string;
}

export const StockVisualizer3D: React.FC<{ items: StockBin[] }> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<{
    itemName: string;
    locationName: string;
    available: number;
    physical: number;
    reserved: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f1e8);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Grid Floor Platform (Neobrutalist styling)
    const gridHelper = new THREE.GridHelper(24, 16, 0x0a0a0a, 0xd0c8b8);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const displayItems = items.slice(0, 6);
    const barsGroup = new THREE.Group();
    scene.add(barsGroup);

    const barMeshes: { mesh: THREE.Mesh; outline: THREE.LineSegments; data: StockBin; targetY: number; defaultY: number }[] = [];
    const colors = [0xffb800, 0xa9d9f2, 0xff6fa8, 0x3ddc84, 0xffb800, 0xa9d9f2];

    const spacing = 3.2;
    const totalWidth = (displayItems.length - 1) * spacing;
    const startX = -totalWidth / 2;

    displayItems.forEach((item, idx) => {
      const available = Math.max(1, item.physicalQty - item.reservedQty);
      const barHeight = Math.min(8, (available / 400) * 6 + 1.2);

      const geometry = new THREE.BoxGeometry(2.2, barHeight, 2.2);
      const material = new THREE.MeshStandardMaterial({
        color: colors[idx % colors.length],
        roughness: 0.2,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const posX = startX + idx * spacing;
      const posY = barHeight / 2;
      mesh.position.set(posX, posY, 0);

      // Black Neobrutalist Outline
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x0a0a0a, linewidth: 3 });
      const outline = new THREE.LineSegments(edges, lineMat);
      mesh.add(outline);

      // Custom User Data for Raycasting
      mesh.userData = { ...item, availableQty: available, index: idx };

      barsGroup.add(mesh);
      barMeshes.push({
        mesh,
        outline,
        data: item,
        targetY: posY,
        defaultY: posY,
      });
    });

    // 3. Mouse Hover Raycaster & Interactive 3D Rotation
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouse.x = (x / rect.width) * 2 - 1;
      mouse.y = -(y / rect.height) * 2 + 1;

      // Subtle interactive scene rotation based on cursor
      targetRotationY = mouse.x * 0.25;

      // Raycast against bars
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(barsGroup.children);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object as THREE.Mesh;
        if (hitObj.type === 'LineSegments' && hitObj.parent) {
          hitObj = hitObj.parent as THREE.Mesh;
        }
        const data = hitObj.userData;

        if (data && data.itemName) {
          setHoveredData({
            itemName: data.itemName,
            locationName: data.locationName,
            available: data.availableQty,
            physical: data.physicalQty,
            reserved: data.reservedQty,
            x,
            y,
          });
        }

        // Hover effect: Elevate and scale hovered bar
        barMeshes.forEach((b) => {
          if (b.mesh === hitObj) {
            b.targetY = b.defaultY + 0.6;
            b.mesh.scale.set(1.1, 1.05, 1.1);
          } else {
            b.targetY = b.defaultY;
            b.mesh.scale.set(1, 1, 1);
          }
        });
      } else {
        setHoveredData(null);
        barMeshes.forEach((b) => {
          b.targetY = b.defaultY;
          b.mesh.scale.set(1, 1, 1);
        });
      }
    };

    const handleMouseLeave = () => {
      setHoveredData(null);
      mouse.set(-1000, -1000);
      targetRotationY = 0;
      barMeshes.forEach((b) => {
        b.targetY = b.defaultY;
        b.mesh.scale.set(1, 1, 1);
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 4. Animation Frame Loop
    let animFrameId = 0;
    const renderLoop = () => {
      // Smooth camera / group rotation
      barsGroup.rotation.y += (targetRotationY - barsGroup.rotation.y) * 0.08;

      // Smooth bar lerp elevation on hover
      barMeshes.forEach((b) => {
        b.mesh.position.y += (b.targetY - b.mesh.position.y) * 0.15;
      });

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // 5. Responsive Resize Observer
    const handleResize = () => {
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [items]);

  return (
    <div ref={containerRef} className="w-full h-80 relative bg-[#F5F1E8] border-3 border-[#0A0A0A] overflow-hidden select-none cursor-grab active:cursor-grabbing">
      {/* 3D Floating Tooltip on Hover */}
      {hoveredData && (
        <div
          className="absolute z-20 pointer-events-none p-3 bg-[#0A0A0A] text-white border-2 border-white shadow-neo-sm font-mono text-xs uppercase"
          style={{
            left: Math.min(hoveredData.x + 15, (containerRef.current?.clientWidth || 300) - 200),
            top: Math.max(10, hoveredData.y - 80),
          }}
        >
          <div className="font-black text-[#FFB800] text-sm">{hoveredData.itemName}</div>
          <div className="text-[10px] text-gray-300 mb-1">📍 {hoveredData.locationName}</div>
          <div className="grid grid-cols-3 gap-2 border-t border-gray-700 pt-1 text-[11px]">
            <div>
              <span className="block text-gray-400 text-[9px]">PHYSICAL</span>
              <span className="font-bold">{hoveredData.physical}</span>
            </div>
            <div>
              <span className="block text-gray-400 text-[9px]">RESERVED</span>
              <span className="font-bold text-red-400">{hoveredData.reserved}</span>
            </div>
            <div>
              <span className="block text-[#3DDC84] text-[9px]">AVAILABLE</span>
              <span className="font-black text-[#3DDC84]">{hoveredData.available}</span>
            </div>
          </div>
        </div>
      )}

      {/* Neobrutalist Helper Overlay */}
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-white border-2 border-[#0A0A0A] font-mono text-[10px] font-black uppercase shadow-neo-sm">
        ✨ INTERACTIVE 3D WEBGL ENGINE // HOVER BARS TO INSPECT
      </div>
    </div>
  );
};
