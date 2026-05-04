import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const SHIRT_W = 2.4;
const SHIRT_H = 2.8;

// Remove white/near-white pixels from a PNG data URL
function removeWhiteBg(dataUrl, threshold = 230) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const r = d.data[i], g = d.data[i+1], b = d.data[i+2];
        if (r >= threshold && g >= threshold && b >= threshold) {
          d.data[i+3] = 0;
        }
      }
      ctx.putImageData(d, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Flip image horizontally on a canvas — fixes mirror inversion for back face
function flipHorizontal(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.translate(img.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function ShirtViewer3D() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { state }   = useLocation();

  const mountRef    = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef    = useRef(null);
  const cameraRef   = useRef(null);
  const controlsRef = useRef(null);
  const animRef     = useRef(null);

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [autoSpin, setAutoSpin] = useState(true);

  const frontDataUrl = state?.frontImage || null;
  const backDataUrl  = state?.backImage  || null;

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping   = true;
    controls.dampingFactor   = 0.07;
    controls.minDistance     = 3;
    controls.maxDistance     = 9;
    controls.maxPolarAngle   = Math.PI * 0.82;
    controls.minPolarAngle   = Math.PI * 0.18;
    controls.autoRotate      = true;
    controls.autoRotateSpeed = 1.5;
    controls.enablePan       = false;
    controlsRef.current = controls;

    build(scene, frontDataUrl, backDataUrl)
      .then(() => setLoading(false))
      .catch(e  => { setError(e.message); setLoading(false); });

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      animRef.current = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoSpin;
  }, [autoSpin]);

  async function build(scene, frontUrl, backUrl) {
    // Step 1: remove white backgrounds
    const [cleanFront, cleanBack] = await Promise.all([
      removeWhiteBg(frontUrl),
      removeWhiteBg(backUrl),
    ]);

    // Step 2: flip back image horizontally so text/logos aren't mirrored
    // when rendered on THREE.BackSide (which mirrors the UV space)
    const flippedBack = await flipHorizontal(cleanBack);

    const loader = new THREE.TextureLoader();

    // Load texture — flipY=true is THREE's default and correct for canvas/PNG sources
    const load = (url) => new Promise(res => {
      if (!url) { res(null); return; }
      loader.load(
        url,
        t => {
          t.flipY = true; // standard canvas → WebGL Y correction
          res(t);
        },
        undefined,
        () => res(null)
      );
    });

    const [frontTex, backTex] = await Promise.all([
      load(cleanFront),
      load(flippedBack),
    ]);

    const geo = new THREE.PlaneGeometry(SHIRT_W, SHIRT_H);

    // FRONT — camera starts facing +Z, so FrontSide faces camera correctly
    if (frontTex) {
      const mat = new THREE.MeshBasicMaterial({
        map: frontTex,
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = 0.01;
      scene.add(mesh);
    }

    // BACK — BackSide renders when camera is on the -Z side (after 180° rotation)
    // We pre-flipped the image so it appears correct (not mirrored)
    if (backTex) {
      const mat = new THREE.MeshBasicMaterial({
        map: backTex,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo.clone(), mat);
      mesh.position.z = -0.01;
      scene.add(mesh);
    }

    // Fallback silhouette if no images provided
    if (!frontTex && !backTex) {
      const silTex = new THREE.CanvasTexture(makeSilhouette(512, 614, "#cccccc"));
      const mat = new THREE.MeshBasicMaterial({ map: silTex, transparent: true, side: THREE.DoubleSide });
      scene.add(new THREE.Mesh(geo, mat));
    }
  }

  function makeSilhouette(w, h, color) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(w*.18, h*.13); ctx.lineTo(w*.82, h*.13);
    ctx.lineTo(w*.96, h*.27); ctx.lineTo(w*.89, h*.31);
    ctx.lineTo(w*.87, h*.98); ctx.lineTo(w*.13, h*.98);
    ctx.lineTo(w*.11, h*.31); ctx.lineTo(w*.04, h*.27);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(w*.5, h*.075, w*.13, h*.065, 0, 0, Math.PI*2);
    ctx.fill();
    return c;
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigate(-1)}>← Back</button>
        <h2 style={S.title}>3D Preview</h2>
        <div style={S.hRight}>
          <button
            style={{ ...S.btn, background: autoSpin ? "#111" : "#fff", color: autoSpin ? "#fff" : "#111" }}
            onClick={() => setAutoSpin(v => !v)}
          >
            {autoSpin ? "⏸ Pause" : "▶ Spin"}
          </button>
          <button style={S.btn} onClick={() => controlsRef.current?.reset()}>⟲ Reset</button>
        </div>
      </div>

      <div style={S.wrap}>
        {loading && (
          <div style={S.overlay}>
            <div style={S.spinner} />
            <p style={S.loadTxt}>Building 3D view…</p>
          </div>
        )}
        {error && (
          <div style={S.overlay}>
            <p style={{ color: "#c00" }}>Error: {error}</p>
            <button style={S.backBtn} onClick={() => navigate(-1)}>Go back</button>
          </div>
        )}
        <div ref={mountRef} style={S.mount} />
      </div>

      <div style={S.tips}>
        <span>🖱 Drag to rotate</span>
        <span>🔍 Scroll to zoom</span>
        <span>↔ Spin to see back</span>
      </div>
    </div>
  );
}

const S = {
  page:    { display:"flex", flexDirection:"column", height:"100vh", fontFamily:"system-ui,sans-serif", background:"#f0f2f5", overflow:"hidden" },
  header:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", background:"#fff", borderBottom:"1px solid #e5e5e5", flexShrink:0 },
  title:   { margin:0, fontSize:18, fontWeight:700 },
  hRight:  { display:"flex", gap:8 },
  backBtn: { background:"#111", color:"#fff", border:"none", padding:"7px 14px", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600 },
  btn:     { padding:"7px 14px", border:"1.5px solid #ccc", borderRadius:7, cursor:"pointer", fontSize:13, fontWeight:600, transition:"all .15s" },
  wrap:    { flex:1, position:"relative", overflow:"hidden" },
  mount:   { width:"100%", height:"100%" },
  overlay: { position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(240,242,245,.92)", zIndex:10 },
  spinner: { width:40, height:40, border:"3px solid #ddd", borderTop:"3px solid #333", borderRadius:"50%", animation:"sp .8s linear infinite" },
  loadTxt: { color:"#666", marginTop:12, fontSize:14 },
  tips:    { display:"flex", gap:20, justifyContent:"center", padding:"8px", background:"#fff", borderTop:"1px solid #eee", fontSize:12, color:"#999", flexShrink:0 },
};

if (typeof document !== "undefined" && !document.getElementById("__sp")) {
  const s = document.createElement("style");
  s.id = "__sp";
  s.textContent = "@keyframes sp{to{transform:rotate(360deg)}}";
  document.head.appendChild(s);
}
