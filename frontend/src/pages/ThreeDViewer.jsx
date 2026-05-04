import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// ─── constants ────────────────────────────────────────────────────────────────
const SHIRT_W = 2.2;   // world-units wide
const SHIRT_H = 2.6;   // world-units tall
const DEPTH   = 0.04;  // gap between front & back planes

export default function ThreeDViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const mountRef   = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef   = useRef(null);
  const cameraRef  = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [autoSpin, setAutoSpin] = useState(true);
  const [shirtCol, setShirtCol] = useState(state?.shirtColor || "#FFFFFF");

  // ─── derived textures from router state ─────────────────────────────────────
  // state = { frontImage, backImage, shirtColor, frontDesign, backDesign }
  const frontDataUrl = state?.frontImage || null;
  const backDataUrl  = state?.backImage  || null;

  // ─── Three.js bootstrap ─────────────────────────────────────────────────────
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Lights ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(3, 4, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, -2, -4);
    scene.add(backLight);

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.08;
    controls.minDistance      = 2;
    controls.maxDistance      = 8;
    controls.maxPolarAngle    = Math.PI * 0.85;
    controls.minPolarAngle    = Math.PI * 0.15;
    controls.autoRotate       = true;
    controls.autoRotateSpeed  = 1.5;
    controlsRef.current = controls;

    // ── Build the shirt ──
    buildShirt(scene, frontDataUrl, backDataUrl, shirtCol)
      .then(() => setLoading(false))
      .catch(err => {
        console.error("3D build failed:", err);
        setError(err.message);
        setLoading(false);
      });

    // ── Resize handler ──
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Render loop ──
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ─── sync auto-spin toggle ──────────────────────────────────────────────────
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoSpin;
    }
  }, [autoSpin]);

  // ─── sync shirt colour tint ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse(obj => {
      if (obj.isMesh && obj.userData.isShirtBase) {
        obj.material.color.set(shirtCol);
        obj.material.needsUpdate = true;
      }
    });
  }, [shirtCol]);

  // ─── buildShirt ─────────────────────────────────────────────────────────────
  async function buildShirt(scene, frontUrl, backUrl, color) {
    const loader = new THREE.TextureLoader();

    // Load a texture from a data URL (or null → transparent fallback)
    const loadTex = (url) =>
      new Promise((resolve) => {
        if (!url) { resolve(null); return; }
        loader.load(
          url,
          (tex) => { tex.flipY = false; resolve(tex); },
          undefined,
          () => resolve(null)
        );
      });

    const [frontTex, backTex] = await Promise.all([
      loadTex(frontUrl),
      loadTex(backUrl),
    ]);

    // ── Shirt silhouette using ExtrudeGeometry ──────────────────────────────
    // We build a 2-D shirt outline in Three.js Shape, then extrude it by a
    // small depth so it has visible thickness when viewed from the side.

    const shape = makeShirtShape(SHIRT_W, SHIRT_H);
    const extrudeSettings = {
      depth: DEPTH,
      bevelEnabled: false,
    };

    // ── Front face ──
    // Use the full extruded geometry but render only the front face (+Z cap)
    // by creating a PlaneGeometry matched to the shirt bounding box.
    // Simpler and avoids UV complexity: two planes, one per side.

    const planeGeo = new THREE.PlaneGeometry(SHIRT_W, SHIRT_H, 1, 1);

    // Front material — shirt-coloured base tinted by the chosen colour,
    // with the design PNG overlaid via a second mesh.
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.FrontSide,
    });
    baseMat.userData.isShirtBase = true;

    // ── Draw shirt silhouette mask using a canvas ──────────────────────────
    const silCanvas = makeShirtSilhouetteCanvas(512, 614, color);
    const silTex = new THREE.CanvasTexture(silCanvas);

    // Front shirt body
    const frontMat = new THREE.MeshStandardMaterial({
      map: silTex,
      transparent: true,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.FrontSide,
    });
    frontMat.userData.isShirtBase = true;

    const frontMesh = new THREE.Mesh(planeGeo, frontMat);
    frontMesh.position.set(0, 0, DEPTH / 2);
    frontMesh.userData.isShirtBase = true;
    scene.add(frontMesh);

    // Back shirt body (flipped)
    const backSilCanvas = makeShirtSilhouetteCanvas(512, 614, color);
    const backSilTex = new THREE.CanvasTexture(backSilCanvas);
    const backMat = new THREE.MeshStandardMaterial({
      map: backSilTex,
      transparent: true,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.BackSide,
    });
    backMat.userData.isShirtBase = true;

    const backMesh = new THREE.Mesh(planeGeo.clone(), backMat);
    backMesh.position.set(0, 0, -DEPTH / 2);
    backMesh.userData.isShirtBase = true;
    scene.add(backMesh);

    // ── Design overlay — front ──────────────────────────────────────────────
    if (frontTex) {
      // Slightly larger plane so design fills shirt area
      const designGeo = new THREE.PlaneGeometry(SHIRT_W * 0.72, SHIRT_H * 0.72);
      const designMat = new THREE.MeshBasicMaterial({
        map: frontTex,
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const designMesh = new THREE.Mesh(designGeo, designMat);
      // Position slightly in front of the shirt face to avoid z-fighting
      designMesh.position.set(0, 0, DEPTH / 2 + 0.001);
      scene.add(designMesh);
    }

    // ── Design overlay — back ───────────────────────────────────────────────
    if (backTex) {
      backTex.flipY = true;
      const designGeoB = new THREE.PlaneGeometry(SHIRT_W * 0.72, SHIRT_H * 0.72);
      const designMatB = new THREE.MeshBasicMaterial({
        map: backTex,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const designMeshB = new THREE.Mesh(designGeoB, designMatB);
      designMeshB.position.set(0, 0, -DEPTH / 2 - 0.001);
      scene.add(designMeshB);
    }

    // ── Sleeves ─────────────────────────────────────────────────────────────
    addSleeve(scene, color, "left");
    addSleeve(scene, color, "right");

    // ── Collar ──────────────────────────────────────────────────────────────
    addCollar(scene, color);
  }

  // ─── helper: shirt silhouette canvas ────────────────────────────────────────
  function makeShirtSilhouetteCanvas(w, h, color) {
    const canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    // Draw the shirt body silhouette
    ctx.fillStyle = color;
    ctx.beginPath();
    // Body trapezoid
    ctx.moveTo(w * 0.18, h * 0.14);   // top-left shoulder
    ctx.lineTo(w * 0.82, h * 0.14);   // top-right shoulder
    ctx.lineTo(w * 0.95, h * 0.28);   // right armpit corner
    ctx.lineTo(w * 0.88, h * 0.30);
    ctx.lineTo(w * 0.86, h * 0.98);   // bottom-right
    ctx.lineTo(w * 0.14, h * 0.98);   // bottom-left
    ctx.lineTo(w * 0.12, h * 0.30);
    ctx.lineTo(w * 0.05, h * 0.28);   // left armpit corner
    ctx.closePath();
    ctx.fill();

    // Collar cut-out
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.08, w * 0.14, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Re-draw collar outline in slightly darker shade
    const darkColor = shadeColor(color, -25);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.08, w * 0.14, h * 0.07, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Stitching lines
    ctx.strokeStyle = `rgba(0,0,0,0.08)`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.15);
    ctx.lineTo(w * 0.5, h * 0.95);
    ctx.stroke();
    ctx.setLineDash([]);

    return canvas;
  }

  // ─── helper: sleeve mesh ─────────────────────────────────────────────────────
  function addSleeve(scene, color, side) {
    const isLeft = side === "left";
    const slW = 0.65, slH = 0.75;
    const geo  = new THREE.PlaneGeometry(slW, slH);
    const canvas = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(256, 80);
      ctx.lineTo(256, 200);
      ctx.lineTo(10,  340);
      ctx.lineTo(10,  160);
    } else {
      ctx.moveTo(0,   80);
      ctx.lineTo(0,   200);
      ctx.lineTo(246, 340);
      ctx.lineTo(246, 160);
    }
    ctx.closePath();
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    mat.userData.isShirtBase = true;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.isShirtBase = true;
    mesh.position.set(isLeft ? -SHIRT_W * 0.6 : SHIRT_W * 0.6, SHIRT_H * 0.22, 0);
    mesh.rotation.z = isLeft ? 0.15 : -0.15;
    scene.add(mesh);
  }

  // ─── helper: collar band ─────────────────────────────────────────────────────
  function addCollar(scene, color) {
    const canvas = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const dark = shadeColor(color, -30);
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.ellipse(128, 52, 80, 38, 0, Math.PI, 0);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(SHIRT_W * 0.42, SHIRT_H * 0.08);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, SHIRT_H * 0.43, DEPTH / 2 + 0.002);
    scene.add(mesh);
  }

  // ─── helper: makeShirtShape (unused for now, kept for future GLTF upgrade) ───
  function makeShirtShape(w, h) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, -h / 2);
    shape.lineTo( w / 2, -h / 2);
    shape.lineTo( w / 2,  h / 2);
    shape.lineTo(-w / 2,  h / 2);
    shape.closePath();
    return shape;
  }

  // ─── colour utility ──────────────────────────────────────────────────────────
  function shadeColor(hex, amount) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back to Studio
        </button>
        <h2 style={styles.title}>3D Preview</h2>
        <div style={styles.controls}>
          <button
            style={{ ...styles.controlBtn, background: autoSpin ? "#000" : "#fff", color: autoSpin ? "#fff" : "#000" }}
            onClick={() => setAutoSpin(v => !v)}
          >
            {autoSpin ? "⏸ Pause" : "▶ Rotate"}
          </button>
          <button style={styles.controlBtn} onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset();
            }
          }}>
            ⟲ Reset view
          </button>
        </div>
      </div>

      {/* Colour picker row */}
      <div style={styles.colourRow}>
        <span style={styles.colourLabel}>Shirt colour:</span>
        {["#FFFFFF","#000000","#1E3A8A","#EF4444","#10B981","#F97316","#8B5CF6","#FACC15"].map(c => (
          <button
            key={c}
            onClick={() => setShirtCol(c)}
            style={{
              ...styles.colourDot,
              background: c,
              border: shirtCol === c ? "3px solid #0b84ff" : "2px solid #ccc",
              boxShadow: shirtCol === c ? "0 0 0 2px #0b84ff44" : "none",
            }}
            title={c}
          />
        ))}
        <input type="color" value={shirtCol} onChange={e => setShirtCol(e.target.value)} style={styles.colourInput} title="Custom colour" />
      </div>

      {/* Canvas mount */}
      <div style={styles.canvasWrap}>
        {loading && (
          <div style={styles.overlay}>
            <div style={styles.spinner} />
            <p style={{ color: "#555", marginTop: 16, fontSize: 14 }}>Building 3D model…</p>
          </div>
        )}
        {error && (
          <div style={styles.overlay}>
            <p style={{ color: "#c00", fontSize: 14 }}>Failed to load 3D viewer: {error}</p>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>Go back</button>
          </div>
        )}
        <div ref={mountRef} style={styles.mount} />
      </div>

      {/* Tip bar */}
      <div style={styles.tipBar}>
        <span>🖱 Drag to rotate</span>
        <span>🔍 Scroll to zoom</span>
        <span>👆 Two-finger pan</span>
        <span>Front &amp; back designs applied as textures</span>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#f5f5f5",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#fff",
    borderBottom: "1px solid #ddd",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: "bold",
  },
  backBtn: {
    background: "#000",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
  },
  controls: {
    display: "flex",
    gap: 10,
  },
  controlBtn: {
    padding: "8px 14px",
    border: "2px solid #000",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  colourRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "#fff",
    borderBottom: "1px solid #eee",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  colourLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginRight: 4,
  },
  colourDot: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  colourInput: {
    width: 32,
    height: 32,
    border: "2px solid #ccc",
    borderRadius: "50%",
    cursor: "pointer",
    padding: 0,
    background: "none",
  },
  canvasWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  mount: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(245,245,245,0.92)",
    zIndex: 10,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #ddd",
    borderTop: "4px solid #000",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
  tipBar: {
    display: "flex",
    gap: 24,
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 20px",
    background: "#fff",
    borderTop: "1px solid #eee",
    fontSize: 12,
    color: "#888",
    flexShrink: 0,
    flexWrap: "wrap",
  },
};

// Inject keyframe for spinner (runs once)
if (typeof document !== "undefined" && !document.getElementById("__3d-spin")) {
  const s = document.createElement("style");
  s.id = "__3d-spin";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}
