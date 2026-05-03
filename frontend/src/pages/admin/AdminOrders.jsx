import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // ✅ Use env variable

function tryParse(json) {
  if (!json) return null;
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function DesignView({ design }) {
  if (!design) return <div className="text-sm text-gray-600">No design</div>;
  const logoSrc = resolveImgSrc(design.logo);
  
  // Handle both old format (single sticker) and new format (array of stickers)
  const stickers = design.selectedStickers || (design.selectedSticker ? [design.selectedSticker] : []);

  return (
    <div className="bg-gray-50 p-2 rounded">
      <div className="text-sm"><strong>👕 Shirt Color:</strong> <span className="inline-block w-4 h-4 align-middle mr-2" style={{background: design.shirtColor || '#fff', border: '1px solid #ccc'}}></span>{design.shirtColor || '—'}</div>
      <div className="text-sm"><strong>Text:</strong> {design.designText || '—'}</div>
      <div className="text-sm"><strong>Color:</strong> <span className="inline-block w-4 h-4 align-middle mr-2" style={{background: design.selectedColor || '#000'}}></span>{design.selectedColor || '—'}</div>
      <div className="text-sm"><strong>Font:</strong> {design.selectedFont || '—'} ({design.fontSize || '—'} px)</div>
      <div className="text-sm mt-2"><strong>Logo:</strong> {logoSrc ? <img src={logoSrc} alt="logo" className="inline-block w-16 h-16 border" /> : (design.logo ? <span className="text-xs text-gray-500">Uploaded (preview not available)</span> : 'None')}</div>
      <div className="text-sm mt-2"><strong>Stickers ({stickers.length}):</strong>
        {stickers.length > 0 ? (
          <div className="ml-2 mt-1">
            {stickers.map((s, idx) => {
              const stickerSrc = resolveImgSrc(s?.url || s);
              return (
                <div key={idx} className="text-xs text-gray-700 mb-1">
                  {s.emoji && <span>{s.emoji} </span>}
                  {s.name && <span>{s.name}</span>}
                  {!s.emoji && !s.name && stickerSrc && <span>Sticker {idx + 1}</span>}
                </div>
              );
            })}
          </div>
        ) : 'None'}
      </div>
      <div className="text-sm mt-2"><strong>Charge:</strong> PKR {Number(design.charge || 0).toFixed(2)}</div>
    </div>
  );
}

function resolveImgSrc(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    // blob URLs aren't shareable between pages but can still be downloaded via fetch
    return val;
  }
  if (typeof val === 'object') {
    // Common places where image data might be stored
    const candidates = [
      'dataURL', 'dataUrl', 'dataurl', 'url', 'src', 'image', 'preview', 'base64', 'data', 'data_uri'
    ];
    for (const key of candidates) {
      if (val[key]) return val[key];
    }
    // nested objects: try some common nested shapes
    if (val.selectedSticker?.url) return val.selectedSticker.url;
    if (val.logo?.dataURL) return val.logo.dataURL;
    // fallback: if object looks like a blob URL string in toString
    try {
      const str = JSON.stringify(val);
      const match = str.match(/data:\w+\/[-+.\w]+;base64,[A-Za-z0-9+/=]+/);
      if (match) return match[0];
    } catch (e) {
      // ignore
    }
    return null;
  }
  return null;
}

function downloadImage(src, filename) {
  if (!src) return;
  // data URL
  if (src.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }

  // remote or blob URL: fetch as blob then download
  fetch(src)
    .then((res) => res.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    })
    .catch(() => alert('Failed to download design'));
}

async function renderAndDownloadDesign(design, baseImageSrc, filename) {
  if (!design || !baseImageSrc) {
    alert('No design or base product image available');
    return;
  }

  // Load base image to get dimensions
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = baseImageSrc;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => resolve();
    setTimeout(resolve, 1500);
  });

  const desiredWidth = img.naturalWidth || 1200;
  const desiredHeight = img.naturalHeight || 1200;

  // Build temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = desiredWidth + 'px';
  container.style.height = desiredHeight + 'px';
  container.style.overflow = 'hidden';
  container.style.background = '#fff';

  // Base product image
  const baseImgEl = document.createElement('img');
  baseImgEl.src = baseImageSrc;
  baseImgEl.style.width = '100%';
  baseImgEl.style.height = '100%';
  baseImgEl.style.objectFit = 'contain';
  baseImgEl.style.position = 'absolute';
  baseImgEl.style.left = '0';
  baseImgEl.style.top = '0';
  baseImgEl.style.zIndex = '0';
  container.appendChild(baseImgEl);

  // Helper to create overlay element
  const makeOverlay = (el, opts = {}) => {
    el.style.position = 'absolute';
    el.style.left = (opts.left || 50) + '%';
    el.style.top = (opts.top || 50) + '%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.zIndex = opts.zIndex != null ? String(opts.zIndex) : '10';
    container.appendChild(el);
  };

  // Text
  if (design.designText) {
    const textEl = document.createElement('div');
    textEl.innerText = design.designText;
    textEl.style.color = design.selectedColor || '#000';
    textEl.style.fontFamily = design.selectedFont || 'Arial, sans-serif';
    // scale font relative to image width; design.fontSize is stored in px for canvas width
    const fontSize = (design.fontSize || 24) * (desiredWidth / (design._canvasWidth || desiredWidth));
    textEl.style.fontSize = `${fontSize}px`;
    textEl.style.whiteSpace = 'normal';
    textEl.style.maxWidth = '80%';
    textEl.style.wordWrap = 'break-word';
    makeOverlay(textEl, { left: design.textPos?.x || 50, top: design.textPos?.y || 50 });
  }

  // Logo
  if (design.logo) {
    const logoSrc = resolveImgSrc(design.logo);
    if (logoSrc) {
      const logoEl = document.createElement('img');
      logoEl.src = logoSrc;
      const logoSize = (design.logoSize || 80) * (desiredWidth / (design._canvasWidth || desiredWidth));
      logoEl.style.width = logoSize + 'px';
      logoEl.style.height = 'auto';
      logoEl.style.objectFit = 'contain';
      makeOverlay(logoEl, { left: design.logoPos?.x || 50, top: design.logoPos?.y || 50 });
    }
  }

  // Stickers (supports both old single sticker and new array of stickers)
  const stickers = design.selectedStickers || (design.selectedSticker ? [design.selectedSticker] : []);
  const stickerPositions = design.stickerPositions || {};
  
  stickers.forEach((sticker, index) => {
    const stickerId = sticker?.id || sticker?.name || `sticker-${index}`;
    const pos = stickerPositions[stickerId] || { x: 50, y: 50 };
    const stickerSize = (sticker.stickerSize || design.stickerSize || 80) * (desiredWidth / (design._canvasWidth || desiredWidth));
    
    // sticker may be emoji (string) or object/url
    if (typeof sticker === 'string' && sticker.length <= 4) {
      const st = document.createElement('div');
      st.innerText = sticker;
      st.style.fontSize = stickerSize + 'px';
      makeOverlay(st, { left: pos.x, top: pos.y });
    } else if (typeof sticker === 'object' && sticker.emoji) {
      const st = document.createElement('div');
      st.innerText = sticker.emoji;
      st.style.fontSize = stickerSize + 'px';
      makeOverlay(st, { left: pos.x, top: pos.y });
    } else {
      const stickerSrc = resolveImgSrc(sticker?.url || sticker);
      if (stickerSrc) {
        const stImg = document.createElement('img');
        stImg.src = stickerSrc;
        stImg.style.width = stickerSize + 'px';
        stImg.style.height = 'auto';
        stImg.style.objectFit = 'contain';
        makeOverlay(stImg, { left: pos.x, top: pos.y });
      }
    }
  });

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { useCORS: true, allowTaint: true, backgroundColor: '#fff' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  } catch (err) {
    console.error('Render/download failed', err);
    alert('Failed to render design for download');
  } finally {
    document.body.removeChild(container);
  }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null); // ✅ Track which order is expanded
  const [orderDetails, setOrderDetails] = useState({}); // ✅ Cache full order details

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/api/orders/admin`); // ✅ Use env variable
      const json = await res.json();
      setOrders(json.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Fetch full order details only when needed
  const fetchOrderDetails = async (orderId) => {
    if (orderDetails[orderId]) {
      setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
      return;
    }
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`); // ✅ Use env variable
      const json = await res.json();
      setOrderDetails(prev => ({ ...prev, [orderId]: json.order }));
      setExpandedOrderId(orderId);
    } catch (err) {
      console.error('Failed to fetch order details', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, { // ✅ Use env variable
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === orderId ? json.order : o)));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6">Orders History</h1>
      {orders.length === 0 && <div>No orders found.</div>}

      <div className="flex flex-col gap-4">
        {orders.map((o) => {
          const total = Number(o.total || 0).toFixed(2);
          const isExpanded = expandedOrderId === o._id;
          const fullOrder = orderDetails[o._id] || o;
          
          return (
            <div key={o._id} className="border rounded p-4">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => fetchOrderDetails(o._id)} // ✅ Lazy load on click
              >
                <div>
                  <div className="font-semibold">Order ID: {o._id}</div>
                  <div className="text-sm text-gray-600">Placed: {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Total: PKR {total}</div>
                  <div className="text-sm">Status:
                    <select
                      value={o.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(o._id, e.target.value);
                      }}
                      className="ml-2 border rounded p-1"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-sm text-blue-600">{isExpanded ? '▼ Click to collapse' : '▶ Click to expand'}</div>
                </div>
              </div>

              {/* ✅ Only show items when expanded */}
              {isExpanded && (
                <>
                  <div>
                    <div className="mb-3">
                      <div className="font-semibold">Customer</div>
                      <div className="text-sm text-gray-700">Name: {fullOrder.address?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-700">Email: {fullOrder.address?.email ? <a href={`mailto:${fullOrder.address.email}`} className="text-blue-600 underline">{fullOrder.address.email}</a> : 'N/A'}</div>
                      <div className="text-sm text-gray-700">Phone: {fullOrder.address?.phone ? <a href={`tel:${fullOrder.address.phone}`} className="text-blue-600 underline">{fullOrder.address.phone}</a> : 'N/A'}</div>
                      <div className="text-sm text-gray-700">Address: {fullOrder.address?.address || ''}{fullOrder.address?.city ? `, ${fullOrder.address.city}` : ''}{fullOrder.address?.postal ? `, ${fullOrder.address.postal}` : ''}</div>
                    </div>
                    <div className="font-semibold mb-2">Items ({fullOrder.items?.length || 0})</div>
                    <div className="flex flex-col gap-3">
                      {(fullOrder.items || []).map((it) => {
                        const customization = tryParse(it.customization) || {};
                        const front = customization.frontDesign || customization.front || null;
                        const back = customization.backDesign || customization.back || null;
                        const frontSrc = resolveImgSrc(front);
                        const backSrc = resolveImgSrc(back);
                        const productPrice = Number(it.price || it.productPrice || 0);
                        const customizationPrice = Number(it.customizationPrice || customization.totalCharge || customization.totalCharge || 0);
                        const lineTotal = ((productPrice + customizationPrice) * (it.quantity || 1)).toFixed(2);
                        
                        // Get the captured design image, prioritizing it over base product image
                        const capturedFrontDesignImage = customization?.frontDesignImage;
                        const capturedBackDesignImage = customization?.backDesignImage;
                        const displayImage = capturedFrontDesignImage || it.frontImage || it.image;
                        
                        return (
                          <div key={it._id || it.productId} className="flex gap-3 items-start">
                            <img src={displayImage} alt={it.name} className="w-20 h-20 object-cover border" />
                            <div className="flex-1">
                              <div className="font-semibold">{it.name} x{it.quantity}</div>
                              <div className="text-sm text-gray-600">Size: {it.size || 'N/A'}</div>
                              <div className="text-sm">Product price: PKR {productPrice.toFixed(2)}</div>
                              <div className="text-sm">Customization price: PKR {customizationPrice.toFixed(2)}</div>
                              <div className="text-sm font-semibold">Line total: PKR {lineTotal}</div>

                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                  <div className="font-semibold">Front Design</div>
                                  {capturedFrontDesignImage && (
                                    <div className="mb-2 border rounded p-2 bg-gray-50">
                                      <img src={capturedFrontDesignImage} alt="Front Design Preview" className="w-full h-auto object-contain" />
                                    </div>
                                  )}
                                  <DesignView design={front} />
                                  {(front || capturedFrontDesignImage) && (
                                    <button
                                      onClick={() => {
                                        if (capturedFrontDesignImage) {
                                          downloadImage(capturedFrontDesignImage, `${o._id}_${it._id || it.productId}_front.png`);
                                        } else {
                                          renderAndDownloadDesign(front, it.frontImage || it.image, `${o._id}_${it._id || it.productId}_front.png`);
                                        }
                                      }}
                                      className="mt-2 inline-block bg-indigo-600 text-white text-sm px-3 py-1 rounded"
                                    >
                                      Download Front Design
                                    </button>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold">Back Design</div>
                                  {capturedBackDesignImage && (
                                    <div className="mb-2 border rounded p-2 bg-gray-50">
                                      <img src={capturedBackDesignImage} alt="Back Design Preview" className="w-full h-auto object-contain" />
                                    </div>
                                  )}
                                  <DesignView design={back} />
                                  {(back || capturedBackDesignImage) && (
                                    <button
                                      onClick={() => {
                                        if (capturedBackDesignImage) {
                                          downloadImage(capturedBackDesignImage, `${o._id}_${it._id || it.productId}_back.png`);
                                        } else {
                                          renderAndDownloadDesign(back, it.frontImage || it.image, `${o._id}_${it._id || it.productId}_back.png`);
                                        }
                                      }}
                                      className="mt-2 inline-block bg-indigo-600 text-white text-sm px-3 py-1 rounded"
                                    >
                                      Download Back Design
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
