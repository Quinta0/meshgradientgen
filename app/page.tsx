"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Component() {
  const [vertices, setVertices] = useState(6);
  const [colors, setColors] = useState(["#4338ca", "#6366f1", "#ec4899", "#8b5cf6"]);
  const [pattern, setPattern] = useState("smooth");
  const canvasRef = useRef(null);

  useEffect(() => {
    generateMeshGradient();
  }, [vertices, colors, pattern]);

  const generateMeshGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    switch (pattern) {
      case "smooth":
        drawSmoothGradient(ctx, width, height);
        break;
      case "triangle":
        drawTriangularMesh(ctx, width, height);
        break;
      case "square":
        drawSquareMesh(ctx, width, height);
        break;
      case "hexagon":
        drawHexagonalMesh(ctx, width, height);
        break;
    }
  };

  const drawSmoothGradient = (ctx, width, height) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const color = getInterpolatedColor(x / width, y / height);
        const index = (y * width + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255; // Alpha channel
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const getInterpolatedColor = (x, y) => {
    const gridSize = Math.sqrt(colors.length);
    const xGrid = Math.floor(x * (gridSize - 1));
    const yGrid = Math.floor(y * (gridSize - 1));
    const xRatio = (x * (gridSize - 1)) - xGrid;
    const yRatio = (y * (gridSize - 1)) - yGrid;

    const topLeft = hexToRgb(colors[yGrid * gridSize + xGrid]);
    const topRight = hexToRgb(colors[yGrid * gridSize + xGrid + 1]);
    const bottomLeft = hexToRgb(colors[(yGrid + 1) * gridSize + xGrid]);
    const bottomRight = hexToRgb(colors[(yGrid + 1) * gridSize + xGrid + 1]);

    const top = interpolateColor(topLeft, topRight, xRatio);
    const bottom = interpolateColor(bottomLeft, bottomRight, xRatio);
    return interpolateColor(top, bottom, yRatio);
  };

  const interpolateColor = (color1, color2, ratio) => {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * ratio),
      g: Math.round(color1.g + (color2.g - color1.g) * ratio),
      b: Math.round(color1.b + (color2.b - color1.b) * ratio)
    };
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  const drawTriangularMesh = (ctx, width, height) => {
    const gridSize = Math.max(width, height) / (vertices - 1);
    const points = createPoints(width, height, gridSize);

    for (let y = 0; y < vertices - 1; y++) {
      for (let x = 0; x < vertices - 1; x++) {
        const topLeft = points[y * vertices + x];
        const topRight = points[y * vertices + x + 1];
        const bottomLeft = points[(y + 1) * vertices + x];
        const bottomRight = points[(y + 1) * vertices + x + 1];

        drawTriangle(ctx, topLeft, topRight, bottomLeft);
        drawTriangle(ctx, bottomRight, bottomLeft, topRight);
      }
    }
  };

  const drawSquareMesh = (ctx, width, height) => {
    const gridSize = Math.max(width, height) / (vertices - 1);
    const points = createPoints(width, height, gridSize);

    for (let y = 0; y < vertices - 1; y++) {
      for (let x = 0; x < vertices - 1; x++) {
        const topLeft = points[y * vertices + x];
        const topRight = points[y * vertices + x + 1];
        const bottomLeft = points[(y + 1) * vertices + x];
        const bottomRight = points[(y + 1) * vertices + x + 1];

        drawSquare(ctx, topLeft, topRight, bottomRight, bottomLeft);
      }
    }
  };

  const drawHexagonalMesh = (ctx, width, height) => {
    const hexRadius = width / (vertices * 2);
    const verticalSpacing = hexRadius * Math.sqrt(3);

    for (let row = 0; row < vertices; row++) {
      for (let col = 0; col < vertices; col++) {
        const centerX = col * hexRadius * 3 + (row % 2 === 0 ? 0 : 1.5 * hexRadius);
        const centerY = row * verticalSpacing;

        if (centerX < width && centerY < height) {
          drawHexagon(ctx, centerX, centerY, hexRadius, getRandomColor());
        }
      }
    }
  };

  const createPoints = (width, height, gridSize) => {
    const points = [];
    for (let y = 0; y < vertices; y++) {
      for (let x = 0; x < vertices; x++) {
        points.push({
          x: x * gridSize,
          y: y * gridSize,
          color: getRandomColor(),
        });
      }
    }
    return points;
  };

  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const drawTriangle = (ctx, p1, p2, p3) => {
    const gradient = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
    gradient.addColorStop(0, p1.color);
    gradient.addColorStop(0.5, p2.color);
    gradient.addColorStop(1, p3.color);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  const drawSquare = (ctx, p1, p2, p3, p4) => {
    const gradient = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
    gradient.addColorStop(0, p1.color);
    gradient.addColorStop(0.33, p2.color);
    gradient.addColorStop(0.66, p3.color);
    gradient.addColorStop(1, p4.color);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
  };

  const drawHexagon = (ctx, centerX, centerY, radius, color) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  const addColor = () => {
    setColors([...colors, "#000000"]);
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleColorChange = (index, value) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
  };

  const downloadGradient = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zip = new JSZip();

    // Add PNG to zip
    const pngBlob = await new Promise(resolve => canvas.toBlob(resolve));
    zip.file("mesh-gradient.png", pngBlob);

    // Add instructions text file to zip
    const instructions = generateInstructions();
    zip.file("instructions.txt", instructions);

    // Generate and save zip file
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "mesh-gradient.zip");
  };

  const generateInstructions = () => {
    if (pattern === "smooth") {
      return `CSS Instructions:
background: radial-gradient(at 0% 0%, ${colors.join(", ")});

Note: This is a simplified representation. The actual mesh gradient is more complex and may not be perfectly replicated with CSS.`;
    } else {
      return `CSS Instructions:
background: linear-gradient(${colors.join(", ")});

Tailwind Instructions:
bg-gradient-to-r from-[${colors[0]}] to-[${colors[colors.length - 1]}]

Note: This is a simplified representation. The actual mesh gradient is more complex and may not be perfectly replicated with CSS or Tailwind.`;
    }
  };

  return (
      <div className="w-full max-w-5xl mx-auto py-12 md:py-16 lg:py-20">
        <div className="px-4 md:px-6">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mesh Gradient Generator</h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Create stunning, customizable mesh gradient patterns with ease.
            </p>
          </div>
          <div className="mt-12 md:mt-16 lg:mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-6">
              {pattern !== "smooth" && (
                  <div>
                    <label htmlFor="vertices" className="block text-sm font-medium">
                      Vertices
                    </label>
                    <div className="relative mt-1">
                      <input
                          type="number"
                          id="vertices"
                          min="3"
                          max="20"
                          value={vertices}
                          onChange={(e) => setVertices(Number(e.target.value))}
                          className="block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
              )}
              {colors.map((color, index) => (
                  <div key={index}>
                    <label htmlFor={`color${index + 1}`} className="block text-sm font-medium">
                      Color {index + 1}
                    </label>
                    <div className="relative mt-1 flex">
                      <input
                          type="color"
                          id={`color${index + 1}`}
                          value={color}
                          onChange={(e) => handleColorChange(index, e.target.value)}
                          className="block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {colors.length > 2 && (
                          <Button onClick={() => removeColor(index)} className="ml-2">
                            <XIcon className="h-4 w-4" />
                          </Button>
                      )}
                    </div>
                  </div>
              ))}
              <Button onClick={addColor}>Add Color</Button>
              <div>
                <label htmlFor="pattern" className="block text-sm font-medium">
                  Pattern
                </label>
                <div className="relative mt-1">
                  <select
                      id="pattern"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      className="block w-full rounded-md border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="smooth">Smooth</option>
                    <option value="triangle">Triangle</option>
                    <option value="square">Square</option>
                    <option value="hexagon">Hexagon</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="col-span-1 lg:col-span-2">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    width={800}
                    height={600}
                />
              </div>
            </div>
          </div>
          <div className="mt-12 md:mt-16 lg:mt-20 flex justify-center">
            <Button size="lg" onClick={downloadGradient}>
              Download
              <DownloadIcon className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
  );
}

function DownloadIcon(props) {
  return (
      <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
  )
}

function XIcon(props) {
  return (
      <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
  )
}