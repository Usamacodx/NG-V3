import { useEffect, useRef, useState } from "react";

export default function ColorWheel({ selectedColor, onColorSelect }) {
  const canvasRef = useRef(null);
  const [wheelSize, setWheelSize] = useState(280);

  // Define the 12 color hues (in degrees)
  const hueStops = [
    { name: "Red", hue: 0 },
    { name: "Red-Orange", hue: 30 },
    { name: "Orange", hue: 60 },
    { name: "Yellow-Orange", hue: 90 },
    { name: "Yellow", hue: 120 },
    { name: "Yellow-Green", hue: 150 },
    { name: "Green", hue: 180 },
    { name: "Blue-Green", hue: 210 },
    { name: "Blue", hue: 240 },
    { name: "Blue-Violet", hue: 270 },
    { name: "Violet", hue: 300 },
    { name: "Red-Violet", hue: 330 },
  ];

  // Generate shades for a given hue
  const generateShades = (hue) => {
    // 4 concentric rings: dark (outside), medium, light, very light (inside, near white)
    const shades = [
      `hsl(${hue}, 100%, 25%)`, // Dark
      `hsl(${hue}, 100%, 45%)`, // Medium
      `hsl(${hue}, 100%, 65%)`, // Light
      `hsl(${hue}, 100%, 85%)`, // Very Light
    ];
    return shades;
  };

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const maxRadius = wheelSize / 2 - 5;
    const minRadius = 20; // Center white circle

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, wheelSize, wheelSize);

    // Draw 12 segments with 4 rings each
    const segmentAngle = 360 / 12;

    hueStops.forEach((hueStop, index) => {
      const shades = generateShades(hueStop.hue);
      const startAngle = (index * segmentAngle - segmentAngle / 2) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle - segmentAngle / 2) * (Math.PI / 180);

      // Draw 4 concentric rings (from outside to inside)
      const ringWidth = (maxRadius - minRadius) / 4;

      shades.forEach((shade, ringIndex) => {
        const outerRadius = maxRadius - ringIndex * ringWidth;
        const innerRadius = outerRadius - ringWidth;

        ctx.fillStyle = shade;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.lineTo(centerX + innerRadius * Math.cos(endAngle), centerY + innerRadius * Math.sin(endAngle));
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.lineTo(centerX + outerRadius * Math.cos(startAngle), centerY + outerRadius * Math.sin(startAngle));
        ctx.fill();

        // Add subtle border for definition
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    });

    // Draw white center circle
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add subtle border to white center
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw selection indicator if a color is selected
    if (selectedColor && selectedColor !== "#ffffff") {
      drawSelectionIndicator(ctx, centerX, centerY, maxRadius, minRadius, selectedColor);
    }
  }, [wheelSize, selectedColor]);

  // Draw a selection indicator on the color wheel
  const drawSelectionIndicator = (ctx, centerX, centerY, maxRadius, minRadius, color) => {
    // Parse the selected color to find its position on the wheel
    const rgb = hexToRgb(color);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hue = hsl.h;

    // Find which segment this hue belongs to
    const segmentAngle = 360 / 12;
    const hueInSegment = ((hue + segmentAngle / 2) % 360) / segmentAngle;
    const segmentIndex = Math.floor(hueInSegment);

    // Calculate position
    const angleInSegment = ((hue % 360) + 360) % 360;
    const segmentStartAngle = (segmentIndex * segmentAngle - segmentAngle / 2) * (Math.PI / 180);
    const segmentEndAngle = ((segmentIndex + 1) * segmentAngle - segmentAngle / 2) * (Math.PI / 180);
    const midAngle = (segmentStartAngle + segmentEndAngle) / 2;

    // Calculate radius based on lightness
    const lightness = hsl.l;
    const ringWidth = (maxRadius - minRadius) / 4;
    let radius = maxRadius - ringWidth * (4 - (lightness / 100) * 4);
    radius = Math.max(minRadius + 5, Math.min(maxRadius - 5, radius));

    const x = centerX + radius * Math.cos(midAngle);
    const y = centerY + radius * Math.sin(midAngle);

    // Draw selection circle
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Helper: Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Helper: Convert RGB to HSL
  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
        default:
          break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100,
    };
  };

  // Helper: Convert HSL to RGB to Hex
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return (
      "#" +
      [f(0), f(8), f(4)]
        .map((x) => {
          const hex = Math.round(x * 255).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  };

  // Handle canvas click
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;

    // Calculate distance and angle from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

    const maxRadius = wheelSize / 2 - 5;
    const minRadius = 20;

    // Check if click is within the wheel
    if (distance > minRadius && distance < maxRadius) {
      // Determine hue based on angle
      const normalizedAngle = ((angle + 360) % 360 + 180) % 360;
      const hue = normalizedAngle;

      // Determine lightness based on distance
      const relativeDist = (distance - minRadius) / (maxRadius - minRadius);
      const lightness = 100 - relativeDist * 70; // Range from 30% to 100%

      // Determine saturation (always full for wheel)
      const saturation = 100;

      // Convert to hex
      const hex = hslToHex(hue, saturation, lightness);
      onColorSelect(hex);
    } else if (distance <= minRadius) {
      // White center
      onColorSelect("#ffffff");
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Responsive sizing
      const newSize = Math.min(280, window.innerWidth * 0.8);
      setWheelSize(newSize);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <canvas
        ref={canvasRef}
        width={wheelSize}
        height={wheelSize}
        onClick={handleCanvasClick}
        style={{
          border: "2px solid #ddd",
          borderRadius: "50%",
          cursor: "crosshair",
          display: "block",
          margin: "0 auto",
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      />
      <p
        style={{
          fontSize: "12px",
          color: "#666",
          marginTop: "10px",
          textAlign: "center",
        }}
      >
        Selected: <strong style={{ color: selectedColor || "#000" }}>●</strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{selectedColor}</span>
      </p>
    </div>
  );
}
