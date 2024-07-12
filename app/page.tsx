"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Component() {
  const [vertices, setVertices] = useState(6);
  const [colors, setColors] = useState(["#4338ca", "#6366f1", "#ec4899", "#8b5cf6"]);
  const [pattern, setPattern] = useState("smooth");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateMeshGradient = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
  }, [vertices, colors, pattern]);

  useEffect(() => {
    generateMeshGradient();
  }, [generateMeshGradient]);

  const drawSmoothGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  const getInterpolatedColor = (x: number, y: number) => {
    const gridSize = Math.sqrt(colors.length);
    const xGrid = Math.floor(x * (gridSize - 1));
    const yGrid = Math.floor(y * (gridSize - 1));
    const xRatio = (x * (gridSize - 1)) - xGrid;
    const yRatio = (y * (gridSize - 1)) - yGrid;

    const topLeft = hexToRgb(colors[yGrid * gridSize + xGrid] || "#000000");
    const topRight = hexToRgb(colors[yGrid * gridSize + xGrid + 1] || "#000000");
    const bottomLeft = hexToRgb(colors[(yGrid + 1) * gridSize + xGrid] || "#000000");
    const bottomRight = hexToRgb(colors[(yGrid + 1) * gridSize + xGrid + 1] || "#000000");

    const top = interpolateColor(topLeft, topRight, xRatio);
    const bottom = interpolateColor(bottomLeft, bottomRight, xRatio);
    return interpolateColor(top, bottom, yRatio);
  };

  const interpolateColor = (color1: RGB, color2: RGB, ratio: number) => {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * ratio),
      g: Math.round(color1.g + (color2.g - color1.g) * ratio),
      b: Math.round(color1.b + (color2.b - color1.b) * ratio)
    };
  };

  const hexToRgb = (hex: string): RGB => {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  const drawTriangularMesh = (ctx: CanvasRenderingContext2D, width: number, height: number)  => {
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

  const drawSquareMesh = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  const drawHexagonalMesh = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

  const createPoints = (width: number, height: number, gridSize: number) => {
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

  const drawTriangle = (ctx: CanvasRenderingContext2D, p1: {x: number, y: number, color: string}, p2: {x: number, y: number, color: string}, p3: {x: number, y: number, color: string}) => {
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

  const drawSquare = (ctx: CanvasRenderingContext2D, p1: {x: number, y: number, color: string}, p2: {x: number, y: number, color: string}, p3: {x: number, y: number, color: string}, p4: {x: number, y: number, color: string}) => {
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

  const drawHexagon = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, color: string) => {
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
    setColors(prevColors => [...prevColors, "#000000"]);
  };

  const removeColor = (index: number) => {
    setColors(prevColors => prevColors.filter((_, i) => i !== index));
  };

  const handleColorChange = (index: number, value: string) => {
    setColors(prevColors => {
      const newColors = [...prevColors];
      newColors[index] = value;
      return newColors;
    });
  };

  const downloadGradient = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zip = new JSZip();

    // Add PNG to zip
    const pngBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
    if (pngBlob) {
      zip.file("mesh-gradient.png", pngBlob);
    }

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
      <div className="w-full max-w-5xl mx-auto pt-12 md:pt-16 lg:pt-20 h-full flex flex-col flex-grow">
        <div className="px-4 md:px-6 h-full">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mesh Gradient Generator</h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Create stunning, customizable mesh gradient patterns with ease.
            </p>
          </div>
          <div className="mt-12 md:mt-16 lg:mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3 h-auto">
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
          <div className="mt-12 md:mt-16 lg:mt-20 flex justify-center mb-10">
            <Button size="lg" onClick={downloadGradient}>
              Download
              <DownloadIcon className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <footer className="bg-muted text-muted-foreground py-6 mb-0">
          <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
            <p className="text-sm">&copy; 2024 Quintavalle Pietro. All rights reserved.</p>
            <nav className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger>Licence</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>MIT License</DialogTitle>
                    <DialogDescription>
                      <p className="font-bold">Copyright (c) 2024 Quintavalle Pietro</p>
                      <p className="mt-2">
                        Permission is hereby granted, free of charge, to any person obtaining a copy
                        of this software and associated documentation files (the &quot;Software&quot;), to deal
                        in the Software without restriction, including without limitation the rights
                        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                        copies of the Software, and to permit persons to whom the Software is
                        furnished to do so, subject to the following conditions:
                      </p>
                      <p>
                        The above copyright notice and this permission notice shall be included in all
                        copies or substantial portions of the Software.
                      </p>
                      <p className="mt-2">
                        THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                        SOFTWARE.
                      </p>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              <a href="https://github.com/Quinta0" target="_blank" rel="noopener noreferrer"
                 className="hover:underline">
                <GitHubIcon className="w-6 h-6"/>
              </a>
              <a href="mailto:0pietroquintavalle0@gmail.com" className="hover:underline">
                <GmailIcon className="w-6 h-6"/>
              </a>
              <a href="https://www.linkedin.com/in/pietro-quintavalle-996b96267/" target="_blank"
                 rel="noopener noreferrer" className="hover:underline">
                <LinkedInIcon className="w-6 h-6"/>
              </a>
            </nav>
          </div>
        </footer>
      </div>
  );
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
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
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
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

function ArrowUpDownIcon(props: React.SVGProps<SVGSVGElement>) {
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
        <path d="m21 16-4 4-4-4"/>
        <path d="M17 20V4"/>
        <path d="m3 8 4-4 4 4"/>
        <path d="M7 4v16"/>
      </svg>
  );
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
      <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0"
      >
        <path d="M12 .5C5.48.5.5 5.48.5 12c0 5.08 3.29 9.35 7.85 10.86.58.1.79-.24.79-.54 0-.27-.01-.99-.01-1.94-3.19.69-3.86-1.54-3.86-1.54-.53-1.36-1.29-1.72-1.29-1.72-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.69 1.26 3.34.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.72 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.45.12-3.02 0 0 .97-.31 3.17 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.2-1.49 3.17-1.18 3.17-1.18.64 1.57.24 2.73.12 3.02.75.81 1.2 1.84 1.2 3.1 0 4.46-2.69 5.43-5.25 5.71.41.35.78 1.03.78 2.08 0 1.5-.01 2.72-.01 3.08 0 .3.21.65.8.54C20.71 21.35 24 17.08 24 12c0-6.52-4.98-11.5-12-11.5z"/>
      </svg>
  )
}

function GmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
      <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0"
      >
        <path d="M12 12.713l11.985-8.677a.868.868 0 0 0-.491-.148H.506c-.177 0-.344.055-.491.148L12 12.713zm0 1.431L.035 5.596A.875.875 0 0 0 0 6.125v11.75c0 .478.387.875.875.875h22.25c.478 0 .875-.387.875-.875V6.125a.875.875 0 0 0-.035-.529L12 14.144z"/>
      </svg>
  )
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
      <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0"
      >
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.5c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.5h-3v-5.5c0-1.379-1.121-2.5-2.5-2.5s-2.5 1.121-2.5 2.5v5.5h-3v-11h3v1.474c.809-1.161 2.201-1.974 3.5-1.974 2.481 0 4.5 2.019 4.5 4.5v7z"/>
      </svg>
  )
}