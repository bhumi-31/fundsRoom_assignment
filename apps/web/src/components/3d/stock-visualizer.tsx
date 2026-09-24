'use client';

import React, { useEffect, useRef } from 'react';

interface StockBin {
  locationName: string;
  itemName: string;
  physicalQty: number;
  reservedQty: number;
}

export const StockVisualizer3D: React.FC<{ items: StockBin[] }> = ({ items }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI canvas dimensions
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    // Draw Isometric 3D Stock Bins Grid
    const displayItems = items.slice(0, 5);
    const binWidth = Math.min(100, (width - 60) / Math.max(1, displayItems.length));
    const startX = 40;
    const baseY = height - 50;

    displayItems.forEach((bin, idx) => {
      const x = startX + idx * (binWidth + 15);
      const available = Math.max(0, bin.physicalQty - bin.reservedQty);
      const barHeight = Math.min(180, (available / 500) * 160 + 20);

      // Shadow
      ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
      ctx.fillRect(x + 6, baseY + 6, binWidth, 12);

      // Front Face
      ctx.fillStyle = idx % 2 === 0 ? '#FFB800' : '#A9D9F2';
      ctx.fillRect(x, baseY - barHeight, binWidth, barHeight);
      ctx.strokeStyle = '#0A0A0A';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, baseY - barHeight, binWidth, barHeight);

      // 3D Top Cap
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(x, baseY - barHeight);
      ctx.lineTo(x + 12, baseY - barHeight - 12);
      ctx.lineTo(x + binWidth + 12, baseY - barHeight - 12);
      ctx.lineTo(x + binWidth, baseY - barHeight);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3D Right Side Face
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.moveTo(x + binWidth, baseY - barHeight);
      ctx.lineTo(x + binWidth + 12, baseY - barHeight - 12);
      ctx.lineTo(x + binWidth + 12, baseY - 12);
      ctx.lineTo(x + binWidth, baseY);
      ctx.closePath();
      ctx.fill();

      // Label Qty
      ctx.fillStyle = '#0A0A0A';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${available} QTY`, x + 5, baseY - barHeight + 20);
    });
  }, [items]);

  return (
    <div className="w-full h-64 relative bg-[#F5F1E8] border-3 border-[#0A0A0A] p-2">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
