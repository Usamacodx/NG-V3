import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SVGShirtContainer from "../components/SVGShirtContainer";
import ColorWheel from "../components/ColorWheel";

const loadImageCORS = (src) =>
  new Promise((resolve, reject) => {
    if (!src) return reject(new Error("No src"));
    const img = new Image();
    img.crossOrigin = "anonymous"; // MUST be before .src
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed: ${src}`));
    img.src = src.startsWith("data:") ? src : (src.includes("?") ? `${src}&_cors=1` : `${src}?_cors=1`);
  });

// Helper function to check if image is SVG (works with base64 or file paths)
const isSVGImage = (imageData) => {
  if (!imageData) return false;
  const isSvg = imageData.includes("data:image/svg+xml") || 
                (typeof imageData === "string" && imageData.toLowerCase().endsWith(".svg"));
  
  // Debug logging
  if (imageData && imageData.length > 0) {
    const preview = imageData.substring(0, 100);
    console.log("isSVGImage check:", { isSvg, preview });
  }
  
  return isSvg;
};

// Utility function to capture a design view as a PNG data URL
const captureDesignAsImage = async (canvasElement) => {
  if (!canvasElement) return null;
  
  try {
    // Get canvas dimensions
    const rect = canvasElement.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 500;
    
    // Use html2canvas to capture the design
    const screenshotCanvas = await html2canvas(canvasElement, {
      backgroundColor: "#f0f0f0",
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: width,
      height: height,
    });
    
    // Convert to data URL
    const dataUrl = screenshotCanvas.toDataURL("image/png");
    return dataUrl;
  } catch (error) {
    console.error("Error capturing design:", error);
    return null;
  }
};

export default function CustomizationStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, updateCartItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);

  const [view, setView] = useState("front");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [shirtColor, setShirtColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(24);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(100);
  const [selectedStickers, setSelectedStickers] = useState([]);
  const [stickerSizes, setStickerSizes] = useState({});
  const [stickerPositions, setStickerPositions] = useState({});
  const [designText, setDesignText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [stickerSearch, setStickerSearch] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("");
  const [frontDataUrl, setFrontDataUrl] = useState(null);
  const [backDataUrl, setBackDataUrl] = useState(null);
  const [apiStickers, setApiStickers] = useState([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState(null);
  const [pexelsTestResult, setPexelsTestResult] = useState(null);
  
  // ✅ NEW: Product color variants from admin
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedProductColor, setSelectedProductColor] = useState(null);

  // Per-side design states so front/back customizations persist separately
  const [frontDesign, setFrontDesign] = useState({
    designText: "",
    selectedColor: "#000000",
    shirtColor: "#FFFFFF",
    fontSize: 24,
    selectedFont: "Arial",
    logo: null,
    logoSize: 100,
    selectedStickers: [],
    stickerSizes: {},
    stickerPositions: {},
    textPos: { x: 50, y: 50 },
    logoPos: { x: 20, y: 20 },
    instructions: "",
  });
        
  const [backDesign, setBackDesign] = useState({
    designText: "",
    selectedColor: "#000000",
    shirtColor: "#FFFFFF",
    fontSize: 24,
    selectedFont: "Arial",
    logo: null,
    logoSize: 100,
    selectedStickers: [],
    stickerSizes: {},
    stickerPositions: {},
    textPos: { x: 50, y: 50 },
    logoPos: { x: 20, y: 20 },
    instructions: "",
  });

  // Positioning states
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [logoPos, setLogoPos] = useState({ x: 20, y: 20 });
  const [draggingElement, setDraggingElement] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [suppressViewSync, setSuppressViewSync] = useState(false);
  const isSwitchingView = useRef(false);

  // ✅ NEW: Selected sticker & resize state for better UX
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [resizingStickerId, setResizingStickerId] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, size: 0 });

  // History for undo/redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fabricColors = [

 
  { name: "Black", color: "#000000" },
   { name: "White", color: "#FFFFFF" },
  { name: "Navy", color: "#1E3A8A" },
  { name: "Gray", color: "#6B7280" },
  { name: "Red", color: "#EF4444" },
  { name: "Blue", color: "#3B82F6" },
  { name: "Green", color: "#10B981" },
   { name: "Orange", color: "#F97316" },
  { name: "Yellow", color: "#FACC15" },
  { name: "Turquoise", color: "#40E0D0" },
  { name: "Coral", color: "#FF7F50" },
  { name: "Magenta", color: "#FF00FF" },
  { name: "Purple", color: "#8B5CF6" },
  { name: "Cyan", color: "#22D3EE" },
  { name: "Olive", color: "#808000" },
  { name: "Maroon", color: "#800000" },
  { name: "Teal", color: "#008080" },
  { name: "Chocolate", color: "#D2691E" },
  { name: "Gold", color: "#FFD700" },
  { name: "Silver", color: "#C0C0C0" },
  { name: "Sky Blue", color: "#87CEEB" },
  { name: "Turquoise Green", color: "#00CED1" },
  { name: "Beige", color: "#F5E6D3" },
  { name: "Pink", color: "#FFD4D4" },
  { name: "Lavender", color: "#E4C7E8" },
  { name: "Mint", color: "#D4E7E7" },
  { name: "Peach", color: "#FFE5D9" },
  

  // Additional colors
 
];


  // Popular stickers with search keywords - High Quality Flaticon Stickers
  const popularStickers = [
       { id: 1, name: "Crying", keywords: "tear sad", url: "https://cdn-icons-png.flaticon.com/512/742/742784.png" },

    { id: 2, name: "Red Heart", keywords: "heart love romantic valentine", url: "https://cdn-icons-png.flaticon.com/512/833/833472.png" },

    { id: 3, name: "Network", keywords: "flower floral bloom garden", url: "https://cdn-icons-png.flaticon.com/512/2540/2540275.png" },
    { id: 4, name: "Mom", keywords: "snowflake winter christmas cold", url: "https://cdn-icons-png.flaticon.com/512/414/414999.png" },
    { id: 5, name: "Tea Cup", keywords: "birthday cake party celebrate", url: "https://cdn-icons-png.flaticon.com/512/924/924514.png" },
    { id: 6, name: "Telescoope", keywords: "balloon birthday party celebration", url: "https://cdn-icons-png.flaticon.com/512/1995/1995567.png" },
    { id: 7, name: "Dog", keywords: "crown royal king queen anniversary", url: "https://cdn-icons-png.flaticon.com/512/1462/1462133.png" },
    { id: 8, name: "Community", keywords: "sun sunshine bright warm", url: "https://cdn-icons-png.flaticon.com/512/681/681494.png" },
    { id: 9, name: "Profile", keywords: "sparkle shine glitter special", url: "https://cdn-icons-png.flaticon.com/512/747/747376.png" },
    { id: 10, name: "Cloud", keywords: "fire flame hot burn cool", url: "https://cdn-icons-png.flaticon.com/512/414/414927.png" },
    { id: 11, name: "Cool", keywords: "sunglasses swag", url: "https://cdn-icons-png.flaticon.com/512/742/742910.png" },
    { id: 12, name: "Innovation", keywords: "rainbow colors spectrum", url: "https://cdn-icons-png.flaticon.com/512/1087/1087840.png" },
    { id: 13, name: "Butterfly", keywords: "butterfly insect nature", url: "https://cdn-icons-png.flaticon.com/512/921/921489.png" },
    { id: 14, name: "Puppy", keywords: "paw pet animal dog cat", url: "https://cdn-icons-png.flaticon.com/512/616/616408.png" },
    { id: 15, name: "Google", keywords: "camera photo vintage picture", url: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png" },
    { id: 16, name: "Partly Sunny", keywords: "anchor nautical sea boat", url: "https://cdn-icons-png.flaticon.com/512/1163/1163661.png" },
    { id: 17, name: "Sea Waves", keywords: "peace sign hippie calm", url: "https://cdn-icons-png.flaticon.com/512/616/616545.png" },
    { id: 18, name: "Thumbs Up", keywords: "like approve good", url: "https://cdn-icons-png.flaticon.com/512/633/633759.png" },
    { id: 19, name: "Message", keywords: "rocket space launch", url: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png" },
 { id: 20, name: "Party", keywords: "celebration", url: "https://cdn-icons-png.flaticon.com/512/742/742751.png" }
];
  
  const fonts = ["Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana", "Impact"];
  const canvasRef = useRef(null);

  // Helper function to validate and use design positions correctly
  const getDesignWithCorrectPositions = () => {
    const currentDesign = view === "front" ? frontDesign : backDesign;
    return {
      designText: designText || currentDesign.designText || "",
      selectedColor: selectedColor || currentDesign.selectedColor || "#FFFFFF",
      fontSize: fontSize || currentDesign.fontSize || 24,
      selectedFont: selectedFont || currentDesign.selectedFont || "Arial",
      logo: logo || currentDesign.logo || null,
      logoSize: logoSize || currentDesign.logoSize || 100,
      selectedStickers: selectedStickers || currentDesign.selectedStickers || [],
      stickerSizes: stickerSizes || currentDesign.stickerSizes || {},
      stickerPositions: stickerPositions || currentDesign.stickerPositions || {},
      textPos: textPos || currentDesign.textPos || { x: 50, y: 50 },
      logoPos: logoPos || currentDesign.logoPos || { x: 20, y: 20 },
    };
  };

  // Load design from preview page (back to edit)
  useEffect(() => {
    if (location.state?.item) {
      const cartItem = location.state.item;
      
      // Parse customization details
      const customDetails = typeof cartItem.customization === "string"
        ? JSON.parse(cartItem.customization)
        : cartItem.customization;

      // Load front and back designs if they exist
      if (customDetails?.frontDesign) {
        setFrontDesign(customDetails.frontDesign);
        if (customDetails.frontDesign.designText) setDesignText(customDetails.frontDesign.designText);
        if (customDetails.frontDesign.selectedColor) setSelectedColor(customDetails.frontDesign.selectedColor);
        // ✅ FIX: Always set shirtColor, use default if missing (for backwards compatibility)
        setShirtColor(customDetails.frontDesign.shirtColor || "#FFFFFF");
        if (customDetails.frontDesign.selectedFont) setSelectedFont(customDetails.frontDesign.selectedFont);
        if (customDetails.frontDesign.fontSize) setFontSize(customDetails.frontDesign.fontSize);
        if (customDetails.frontDesign.logo) setLogo(customDetails.frontDesign.logo);
        if (customDetails.frontDesign.logoSize) setLogoSize(customDetails.frontDesign.logoSize);
        if (customDetails.frontDesign.selectedStickers) setSelectedStickers(customDetails.frontDesign.selectedStickers);
        if (customDetails.frontDesign.stickerSizes) setStickerSizes(customDetails.frontDesign.stickerSizes);
        if (customDetails.frontDesign.stickerPositions) setStickerPositions(customDetails.frontDesign.stickerPositions);
        if (customDetails.frontDesign.textPos) setTextPos(customDetails.frontDesign.textPos);
        if (customDetails.frontDesign.logoPos) setLogoPos(customDetails.frontDesign.logoPos);
      }

      if (customDetails?.backDesign) {
        setBackDesign(customDetails.backDesign);
      }

      if (customDetails?.instructions) {
        setInstructions(customDetails.instructions);
      }

      // Set initial view to front. suppress view-sync briefly to avoid race overwriting restored UI
      setSuppressViewSync(true);
      setView("front");
      // Wait a bit to ensure restored front/back designs are set, then re-apply UI from the restored data
      setTimeout(() => {
        setSuppressViewSync(false);
        if (customDetails?.frontDesign) {
          const f = customDetails.frontDesign;
          if (f.designText) setDesignText(f.designText);
          if (f.selectedColor) setSelectedColor(f.selectedColor);
          // ✅ FIX: Always set shirtColor, use default if missing
          setShirtColor(f.shirtColor || "#FFFFFF");
          if (f.selectedFont) setSelectedFont(f.selectedFont);
          if (f.fontSize) setFontSize(f.fontSize);
          if (f.logo) setLogo(f.logo);
          if (f.logoSize) setLogoSize(f.logoSize);
          if (f.selectedStickers) setSelectedStickers(f.selectedStickers);
          if (f.stickerSizes) setStickerSizes(f.stickerSizes);
          if (f.stickerPositions) setStickerPositions(f.stickerPositions);
          if (f.textPos) setTextPos(f.textPos);
          if (f.logoPos) setLogoPos(f.logoPos);
        }
      }, 300);
    }
  }, [location.state?.item]);

      // Note: UI syncing on view change handled by the dedicated view-only effect below.

  // ✅ Fetch product with color variants from the backend (single source of truth)
  useEffect(() => {
    if (!id) {
      return;
    }

    let isCancelled = false;

    const fetchProductData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const productData = await response.json();
        if (isCancelled) return;

        setProduct(productData);

        const variants = Array.isArray(productData?.colorVariants)
          ? productData.colorVariants
          : [];
        setAvailableColors(variants);
        setSelectedProductColor(variants[0]?.colorName || null);
      } catch (error) {
        console.error("Failed to load product:", error);
        alert("Failed to load product. Please try again.");
      }
    };

    fetchProductData();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  // ✅ Fetch and update product images as data URLs when product or selected color changes
  useEffect(() => {
    if (!product) {
      return;
    }

    const convertImageToDataUrl = async (imageUrl) => {
      if (!imageUrl) return null;

      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("FileReader error"));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn("⚠️ Failed to convert image to data URL:", imageUrl, error.message);
        return null;
      }
    };

    (async () => {
      try {
        let frontImageUrl = product.frontImage;
        let backImageUrl = product.backImage;

        if (selectedProductColor && availableColors.length > 0) {
          const selectedVariant = availableColors.find(
            (variant) => variant.colorName === selectedProductColor
          );
          if (selectedVariant) {
            frontImageUrl = selectedVariant.frontImage || product.frontImage;
            backImageUrl = selectedVariant.backImage || product.backImage;
          }
        }

        const frontDataUrl = await convertImageToDataUrl(frontImageUrl);
        const backDataUrl = await convertImageToDataUrl(backImageUrl);

        setFrontDataUrl(frontDataUrl);
        setBackDataUrl(backDataUrl);
      } catch (error) {
        console.error("Error converting images:", error);
      }
    })();
  }, [product, selectedProductColor, availableColors]);



  

  // ✅ Handle product color selection
  const handleProductColorSelect = (colorName) => {
    setSelectedProductColor(colorName);
  };

  // ✅ Calculate dynamic customization price
  const calculateCustomizationPrice = () => {
    let price = 0;

    if (designText.length > 0) {
      price += 200; // Text customization
    }
    if (logo) {
      price += 300; // Logo upload
    }
    if (selectedStickers.length > 0) {
      price += 150 * selectedStickers.length; // Sticker (Rs.150 per sticker)
    }

    return price;
  };

  // Calculate customization price for a specific design object
  const calculateDesignPrice = (design) => {
    let price = 0;
    if (design.designText && design.designText.length > 0) {
      price += 200; // Text customization
    }
    if (design.logo) {
      price += 300; // Logo upload
    }
    if (design.selectedStickers && design.selectedStickers.length > 0) {
      price += 150 * design.selectedStickers.length; // Sticker (Rs.150 per sticker)
    }
    return price;
  };

  // Get total front + back charges
  const getTotalCharges = () => {
    const frontPrice = calculateDesignPrice(frontDesign);
    const backPrice = calculateDesignPrice(backDesign);
    return frontPrice + backPrice;
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result); // save as data URL so it persists across pages
      };
      reader.onerror = () => {
        console.warn("Failed to read logo file");
      };
      reader.readAsDataURL(file);
    }
  };

  // Emoji sticker library for fallback
  const emojiStickers = {
    "cap": [{ name: "Baseball Cap", emoji: "🧢" }, { name: "Crown", emoji: "👑" }],
    "cloud": [{ name: "Cloud", emoji: "☁️" }, { name: "Cloudy", emoji: "🌥️" }, { name: "Thundercloud", emoji: "⛈️" }],
    "cake": [{ name: "Birthday Cake", emoji: "🎂" }, { name: "Cupcake", emoji: "🧁" }],
    "star": [{ name: "Star", emoji: "⭐" }, { name: "Sparkles", emoji: "✨" }],
    "love": [{ name: "Red Heart", emoji: "❤️" }, { name: "Heartbreak", emoji: "💔" }, { name: "Pink Heart", emoji: "🩷" }],
    "birthday": [{ name: "Birthday Cake", emoji: "🎂" }, { name: "Party Popper", emoji: "🎉" }, { name: "Balloon", emoji: "🎈" }],
    "fire": [{ name: "Fire", emoji: "🔥" }, { name: "Flame", emoji: "🔥" }],
    "smile": [{ name: "Grinning Face", emoji: "😀" }, { name: "Smiling Face", emoji: "😊" }, { name: "Laughing", emoji: "😂" }],
    "flower": [{ name: "Rose", emoji: "🌹" }, { name: "Sunflower", emoji: "🌻" }, { name: "Tulip", emoji: "🌷" }],
    "music": [{ name: "Musical Note", emoji: "🎵" }, { name: "Music Notes", emoji: "🎶" }, { name: "Headphones", emoji: "🎧" }],
    "cat": [{ name: "Cat Face", emoji: "😸" }, { name: "Cat", emoji: "🐱" }, { name: "Tiger", emoji: "🐯" }],
    "dog": [{ name: "Dog Face", emoji: "🐶" }, { name: "Dog", emoji: "🐕" }],
    "sun": [{ name: "Sunshine", emoji: "☀️" }, { name: "Sunny", emoji: "🌞" }],
    "moon": [{ name: "Crescent Moon", emoji: "🌙" }, { name: "Full Moon", emoji: "🌕" }],
    "snow": [{ name: "Snowflake", emoji: "❄️" }, { name: "Snowman", emoji: "⛄" }],
    "rain": [{ name: "Rain", emoji: "🌧️" }, { name: "Umbrella", emoji: "☔" }],
    "heart": [{ name: "Red Heart", emoji: "❤️" }, { name: "Pink Heart", emoji: "🩷" }, { name: "Blue Heart", emoji: "💙" }],
    "gift": [{ name: "Wrapped Gift", emoji: "🎁" }, { name: "Gift Box", emoji: "🎀" }],
    "butterfly": [{ name: "Butterfly", emoji: "🦋" }],
    "tree": [{ name: "Tree", emoji: "🌲" }, { name: "Palm Tree", emoji: "🌴" }],
    "rainbow": [{ name: "Rainbow", emoji: "🌈" }],
    "heart": [{ name: "Heart", emoji: "❤️" }],
  };

  // Fetch stickers/images using Pexels (if API key provided) with Unsplash Source fallback
  // and emoji fallback for best UX during development without a key.
  const fetchStickersFromAPI = async (query) => {
    if (!query.trim()) {
      setApiStickers([]);
      setStickerError(null);
      return;
    }

    setStickerLoading(true);
    setStickerError(null);
    let fetchedStickers = []; // ← ADD THIS LINE


    try {
      // Prefer Pexels if the developer has set an API key in .env as REACT_APP_PEXELS_API_KEY
      const pexelsKey = process.env.REACT_APP_PEXELS_API_KEY;

      if (pexelsKey) {
        try {
          const pexelsRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,
            { headers: { Authorization: pexelsKey } }
          );

          

          if (pexelsRes.ok) {
            const data = await pexelsRes.json();
            if (data.photos && data.photos.length > 0) {
              const stickers = data.photos.map((photo, index) => ({
                id: `pexels_${photo.id}`,
                name: photo.photographer || `${query.charAt(0).toUpperCase() + query.slice(1)} ${index + 1}`,
                keywords: query,
                url: photo.src && (photo.src.medium || photo.src.small || photo.src.large) || null,
              }));
              fetchedStickers = stickers;   // ← ADD before

              setApiStickers(stickers);
              return;
            }
          } else {
            console.warn("Pexels API returned status", pexelsRes.status);
          }
        } catch (pexErr) {
          console.warn("Pexels fetch failed:", pexErr.message);
        }
      }

      // Fallback: Use Unsplash Source (no API key required). Generate multiple unique URLs
      // by adding a `sig` query parameter so the server returns varied photos for the same query.
      const unsplashCount = 12;
      const unsplashResults = Array.from({ length: unsplashCount }).map((_, i) => ({
        id: `unsplash_${i}`,
        name: `${query.charAt(0).toUpperCase() + query.slice(1)} ${i + 1}`,
        keywords: query,
        url: `https://source.unsplash.com/600x600/?${encodeURIComponent(query)}&sig=${i}`,
      }));
     
      fetchedStickers = unsplashResults;  // ← ADD before
      setApiStickers(unsplashResults);
      return;
    } catch (error) {
      console.error("Sticker fetch error:", error);
    } finally {
      // If we have no apiStickers by now, fall back to emoji stickers so the UI isn't empty
      setStickerLoading(false);
      if (fetchedStickers.length === 0) {
        const lowerQuery = query.toLowerCase();
        let emojiResults = [];

        Object.entries(emojiStickers).forEach(([key, values]) => {
          if (key.includes(lowerQuery) || lowerQuery.includes(key)) {
            emojiResults = emojiResults.concat(values);
          }
        });

        if (emojiResults.length === 0) {
          const commonEmojis = ["🎉", "🌟", "💫", "✨", "🎊", "🎈", "🎁", "💝", "🌈", "🔥"];
          emojiResults = commonEmojis.map((emoji, index) => ({
            name: `${query} ${index + 1}`,
            emoji: emoji,
          }));
        }

        const emojiStickersFormatted = emojiResults.map((sticker, index) => ({
          id: `emoji_${index}`,
          name: sticker.name || `Sticker ${index + 1}`,
          keywords: query,
          url: null,
          emoji: sticker.emoji,
        }));

        setApiStickers(emojiStickersFormatted);
      }
    }
  };

  // Debounced search handler
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      if (stickerSearch.trim()) {
        fetchStickersFromAPI(stickerSearch);
      } else {
        setApiStickers([]);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayTimer);
  }, [stickerSearch]);

  const handleMouseDown = (e) => {
    const element = e.currentTarget.getAttribute("data-element");
    if (!element) return;

    // ✅ Check if clicking on a resize handle for stickers
    if (element.startsWith("sticker-resize-")) {
      const stickerId = element.substring(15); // Remove "sticker-resize-" prefix
      setResizingStickerId(stickerId);
      const rect = canvasRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        size: stickerSizes[stickerId] || 80,
      });
      e.preventDefault();
      return;
    }

    // ✅ Check if clicking on a resize handle for logo
    if (element === "logo-resize-") {
      const rect = canvasRef.current.getBoundingClientRect();
      setResizingStickerId("logo"); // Reuse resizingStickerId for logo
      setResizeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        size: logoSize,
      });
      e.preventDefault();
      return;
    }

    setDraggingElement(element);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

 

    
    if (element === "text") {
      setOffset({ x: x - (textPos.x / 100) * rect.width, y: y - (textPos.y / 100) * rect.height });
    } else if (element === "logo") {
      setOffset({ x: x - (logoPos.x / 100) * rect.width, y: y - (logoPos.y / 100) * rect.height });
    } else if (element.startsWith("sticker-")) {
      const stickerId = element.substring(8); // Remove "sticker-" prefix
      setSelectedStickerId(stickerId);
      const pos = stickerPositions[stickerId] || { x: 70, y: 70 };
      setOffset({ x: x - (pos.x / 100) * rect.width, y: y - (pos.y / 100) * rect.height });
    }
  };

  const handleMouseMove = (e) => {
    // ✅ Handle resizing for both stickers and logo
    if (resizingStickerId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // ✅ Use diagonal distance for intuitive resize behavior
      const distX = x - resizeStart.x;
      const distY = y - resizeStart.y;
      const distance = Math.sqrt(distX * distX + distY * distY);
      
      // Determine direction based on diagonal movement
      const direction = (distX > 0 && distY > 0) ? 1 : (distX < 0 && distY < 0) ? -1 : 
                       (Math.abs(distX) > Math.abs(distY)) ? (distX > 0 ? 1 : -1) : (distY > 0 ? 1 : -1);
      
      const newSize = Math.max(40, Math.min(200, resizeStart.size + (distance * direction / 2)));
      
      // Handle logo resize
      if (resizingStickerId === "logo") {
        setLogoSize(newSize);
      } else {
        // Handle sticker resize
        setStickerSizes((prev) => ({
          ...prev,
          [resizingStickerId]: newSize,
        }));
      }
      return;
    }

    if (!draggingElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;

    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    if (draggingElement === "text") {
      setTextPos({ x: xPercent, y: yPercent });
    } else if (draggingElement === "logo") {
      setLogoPos({ x: xPercent, y: yPercent });
    } else if (draggingElement.startsWith("sticker-")) {
      const stickerId = draggingElement.substring(8); // Remove "sticker-" prefix
      setStickerPositions((prev) => ({
        ...prev,
        [stickerId]: { x: xPercent, y: yPercent },
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
    setResizingStickerId(null);
  };

  // ✅ NEW: Handle keyboard shortcuts (Delete key for selected sticker)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedStickerId) {
        handleDeleteSticker(selectedStickerId);
        setSelectedStickerId(null);
        e.preventDefault();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStickerId]);

  // Handle sticker deletion
  const handleDeleteSticker = (stickerId) => {
    setSelectedStickers((prev) => prev.filter((s) => s.id !== stickerId));
    setStickerSizes((prev) => {
      const updated = { ...prev };
      delete updated[stickerId];
      return updated;
    });
    setStickerPositions((prev) => {
      const updated = { ...prev };
      delete updated[stickerId];
      return updated;
    });
  };

  // Undo/Redo functions
  const saveToHistory = () => {
    const state = {
      designText,
      selectedColor,
      shirtColor,
      fontSize,
      selectedFont,
      logo,
      logoSize,
      selectedStickers,
      stickerSizes,
      stickerPositions,
      textPos,
      logoPos,
    };
    
    // Only save if this state is different from the last saved state
    if (historyIndex >= 0) {
      const lastState = history[historyIndex];
      if (JSON.stringify(lastState) === JSON.stringify(state)) {
        return; // Don't save if it's identical to last state
      }
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setDesignText(previousState.designText);
      setSelectedColor(previousState.selectedColor);
      setShirtColor(previousState.shirtColor || "#FFFFFF");
      setFontSize(previousState.fontSize);
      setSelectedFont(previousState.selectedFont);
      setLogo(previousState.logo);
      setLogoSize(previousState.logoSize);
      setSelectedStickers(previousState.selectedStickers);
      setStickerSizes(previousState.stickerSizes);
      setStickerPositions(previousState.stickerPositions);
      setTextPos(previousState.textPos);
      setLogoPos(previousState.logoPos);
      // after restoring UI, persist into current side design
      const restored = {
        designText: previousState.designText,
        selectedColor: previousState.selectedColor,
        shirtColor: previousState.shirtColor || "#FFFFFF",
        fontSize: previousState.fontSize,
        selectedFont: previousState.selectedFont,
        logo: previousState.logo,
        logoSize: previousState.logoSize,
        selectedStickers: previousState.selectedStickers,
        stickerSizes: previousState.stickerSizes,
        stickerPositions: previousState.stickerPositions,
        textPos: previousState.textPos,
        logoPos: previousState.logoPos,
        instructions,
      };
      if (view === "front") setFrontDesign(restored);
      else setBackDesign(restored);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDesignText(nextState.designText);
      setSelectedColor(nextState.selectedColor);
      setShirtColor(nextState.shirtColor || "#FFFFFF");
      setFontSize(nextState.fontSize);
      setSelectedFont(nextState.selectedFont);
      setLogo(nextState.logo);
      setLogoSize(nextState.logoSize);
      setSelectedStickers(nextState.selectedStickers);
      setStickerSizes(nextState.stickerSizes);
      setStickerPositions(nextState.stickerPositions);
      setTextPos(nextState.textPos);
      setLogoPos(nextState.logoPos);
      // persist restored state into current side
      const restored = {
        designText: nextState.designText,
        selectedColor: nextState.selectedColor,
        shirtColor: nextState.shirtColor || "#FFFFFF",
        fontSize: nextState.fontSize,
        selectedFont: nextState.selectedFont,
        logo: nextState.logo,
        logoSize: nextState.logoSize,
        selectedStickers: nextState.selectedStickers,
        stickerSizes: nextState.stickerSizes,
        stickerPositions: nextState.stickerPositions,
        textPos: nextState.textPos,
        logoPos: nextState.logoPos,
        instructions,
      };
      if (view === "front") setFrontDesign(restored);
      else setBackDesign(restored);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Logo size controls - Removed (using drag-to-resize instead)

  const handleDeleteLogo = () => {
    setLogo(null);
    setLogoSize(100);
    setLogoPos({ x: 20, y: 20 });
  };

  // Auto-save to history when design changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToHistory();
    }, 1000);
    return () => clearTimeout(timer);
  }, [designText, selectedColor, shirtColor, fontSize, selectedFont, logo, logoSize, selectedStickers, stickerSizes, stickerPositions, textPos, logoPos]);

  // When switching view, load that side's design into the UI state
  // NOTE: depend only on `view` to avoid re-loading on every internal save
  // CRITICAL FIX: Properly reset stickers, sizes, and positions for each view
  useEffect(() => {
     if (suppressViewSync) return;
  isSwitchingView.current = true;
  const current = view === "front" ? frontDesign : backDesign;
  setDesignText(current.designText !== undefined ? current.designText : "");
  setSelectedColor(current.selectedColor !== undefined ? current.selectedColor : "#000000");
  setShirtColor(current.shirtColor !== undefined ? current.shirtColor : "#FFFFFF");
  setFontSize(current.fontSize !== undefined ? current.fontSize : 24);
  setSelectedFont(current.selectedFont || "Arial");
  setLogo(current.logo || null);
  setLogoSize(current.logoSize !== undefined ? current.logoSize : 100);
  setSelectedStickers(Array.isArray(current.selectedStickers) ? [...current.selectedStickers] : []);
  setStickerSizes({ ...(current.stickerSizes || {}) });
  setStickerPositions({ ...(current.stickerPositions || {}) });
  setTextPos(current.textPos || { x: 50, y: 50 });
  setLogoPos(current.logoPos || { x: 20, y: 20 });
  setInstructions(current.instructions || "");
  setSelectedStickerId(null);
  // Unblock persist after all state setters have flushed
  setTimeout(() => { isSwitchingView.current = false; }, 0);
  }, [view]);

  // Persist UI changes into the current side's design object
  // Skip persisting while we are restoring state from preview/back-to-edit to avoid overwriting
  useEffect(() => {
    if (suppressViewSync) return;
  if (isSwitchingView.current) return;   // ← KEY FIX: don't persist stale state mid-switch

  const snapshot = {
    designText,
    selectedColor,
    shirtColor,
    fontSize,
    selectedFont,
    logo,
    logoSize,
    selectedStickers,
    stickerSizes,
    stickerPositions,
    textPos,
    logoPos,
    instructions,
  };
  if (view === "front") {
    setFrontDesign(snapshot);
  } else {
    setBackDesign(snapshot);
  }
  }, [designText, selectedColor, shirtColor, fontSize, selectedFont, logo, logoSize, selectedStickers, stickerSizes, stickerPositions, textPos, logoPos, instructions, view, suppressViewSync]);

  const handleReset = () => {
    const defaults = {
      designText: "",
      selectedColor: "#000000",
      shirtColor: "#FFFFFF",
      fontSize: 24,
      selectedFont: "Arial",
      logo: null,
      logoSize: 100,
      selectedStickers: [],
      stickerSizes: {},
      stickerPositions: {},
      textPos: { x: 50, y: 50 },
      logoPos: { x: 20, y: 20 },
      instructions: "",
    };

    setDesignText(defaults.designText);
    setSelectedColor(defaults.selectedColor);
    setShirtColor(defaults.shirtColor);
    setFontSize(defaults.fontSize);
    setSelectedFont(defaults.selectedFont);
    setLogo(defaults.logo);
    setLogoSize(defaults.logoSize);
    setSelectedStickers(defaults.selectedStickers);
    setStickerSizes(defaults.stickerSizes);
    setStickerPositions(defaults.stickerPositions);
    setInstructions(defaults.instructions);
    setTextPos(defaults.textPos);
    setLogoPos(defaults.logoPos);
    // reset only the current side's saved design, but preserve shirtColor
    if (view === "front") setFrontDesign({...defaults, shirtColor: frontDesign.shirtColor || defaults.shirtColor});
    else setBackDesign({...defaults, shirtColor: backDesign.shirtColor || defaults.shirtColor});
    // clear history globally
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleAddToCart = async () => {
  if (!product) { alert("Product not found"); return; }

  // Save current live UI into the correct side FIRST before any view switching
  const liveSnapshot = {
    designText, selectedColor, shirtColor, fontSize, selectedFont,
    logo, logoSize,
    selectedStickers: selectedStickers.filter(s => s && s.id),
    stickerSizes, stickerPositions, textPos, logoPos, instructions,
  };

  // Capture immutable copies of both designs right now
  const savedFrontDesign = view === "front"
    ? { ...liveSnapshot }
    : { ...frontDesign };
  const savedBackDesign = view === "back"
    ? { ...liveSnapshot }
    : { ...backDesign };

  const totalCustomizationPrice =
    calculateDesignPrice(savedFrontDesign) + calculateDesignPrice(savedBackDesign);

  // Capture front image — switch view but suppress persist
  setSuppressViewSync(true);

  // Load front design into UI for capture
  setDesignText(savedFrontDesign.designText || "");
  setSelectedColor(savedFrontDesign.selectedColor || "#000000");
  setShirtColor(savedFrontDesign.shirtColor || "#FFFFFF");
  setFontSize(savedFrontDesign.fontSize || 24);
  setSelectedFont(savedFrontDesign.selectedFont || "Arial");
  setLogo(savedFrontDesign.logo || null);
  setLogoSize(savedFrontDesign.logoSize || 100);
  setSelectedStickers(savedFrontDesign.selectedStickers || []);
  setStickerSizes(savedFrontDesign.stickerSizes || {});
  setStickerPositions(savedFrontDesign.stickerPositions || {});
  setTextPos(savedFrontDesign.textPos || { x: 50, y: 50 });
  setLogoPos(savedFrontDesign.logoPos || { x: 20, y: 20 });
  setView("front");
  await new Promise(r => setTimeout(r, 150));
  const frontImageCapture = await captureDesignAsImage(canvasRef.current);

  // Load back design into UI for capture
  setDesignText(savedBackDesign.designText || "");
  setSelectedColor(savedBackDesign.selectedColor || "#000000");
  setShirtColor(savedBackDesign.shirtColor || "#FFFFFF");
  setFontSize(savedBackDesign.fontSize || 24);
  setSelectedFont(savedBackDesign.selectedFont || "Arial");
  setLogo(savedBackDesign.logo || null);
  setLogoSize(savedBackDesign.logoSize || 100);
  setSelectedStickers(savedBackDesign.selectedStickers || []);
  setStickerSizes(savedBackDesign.stickerSizes || {});
  setStickerPositions(savedBackDesign.stickerPositions || {});
  setTextPos(savedBackDesign.textPos || { x: 50, y: 50 });
  setLogoPos(savedBackDesign.logoPos || { x: 20, y: 20 });
  setView("back");
  await new Promise(r => setTimeout(r, 150));
  const backImageCapture = await captureDesignAsImage(canvasRef.current);

  // Restore the original view and live state
  const originalDesign = view === "front" ? savedFrontDesign : savedBackDesign;
  setDesignText(originalDesign.designText || "");
  setSelectedColor(originalDesign.selectedColor || "#000000");
  setShirtColor(originalDesign.shirtColor || "#FFFFFF");
  setFontSize(originalDesign.fontSize || 24);
  setSelectedFont(originalDesign.selectedFont || "Arial");
  setLogo(originalDesign.logo || null);
  setLogoSize(originalDesign.logoSize || 100);
  setSelectedStickers(originalDesign.selectedStickers || []);
  setStickerSizes(originalDesign.stickerSizes || {});
  setStickerPositions(originalDesign.stickerPositions || {});
  setTextPos(originalDesign.textPos || { x: 50, y: 50 });
  setLogoPos(originalDesign.logoPos || { x: 20, y: 20 });

  // Commit clean designs to state
  setFrontDesign({ ...savedFrontDesign, charge: calculateDesignPrice(savedFrontDesign) });
  setBackDesign({ ...savedBackDesign, charge: calculateDesignPrice(savedBackDesign) });
  setSuppressViewSync(false);

  const customizationDetails = {
    frontDesign: { ...savedFrontDesign, charge: calculateDesignPrice(savedFrontDesign) },
    backDesign:  { ...savedBackDesign,  charge: calculateDesignPrice(savedBackDesign) },
    instructions,
    totalCharge: totalCustomizationPrice,
    shirtColor: shirtColor || "#FFFFFF",
    frontDesignImage: frontImageCapture,
    backDesignImage:  backImageCapture,
  };

  const customizationString = JSON.stringify(customizationDetails);

  if (!user) {
    const pending = {
      type: "add",
      payload: {
        product, quantity, size: selectedSize,
        customization: customizationString,
        customizationPrice: totalCustomizationPrice,
      },
    };
    localStorage.setItem("pendingAction", JSON.stringify(pending));
    alert("Please sign in or sign up to complete adding to cart.");
    navigate("/login");
    return;
  }

  if (location.state?.item) {
    const cartItem = location.state.item;
    const newItem = {
      _id: product._id, name: product.name, image: product.image,
      price: product.price, quantity, size: selectedSize,
      customization: customizationString,
      customizationPrice: totalCustomizationPrice,
      frontImage: frontImageCapture || product.frontImage || null,
      backImage:  backImageCapture  || product.backImage  || null,
    };
    updateCartItem(cartItem._id, cartItem.size, cartItem.customization, newItem);
    alert("Updated cart item with new customization");
    navigate("/cart");
  } else {
    addToCart(product, quantity, selectedSize, customizationString,
      totalCustomizationPrice, frontImageCapture, backImageCapture);
    alert(`Added to cart with Rs.${totalCustomizationPrice} customization charge!`);
    navigate("/cart");
  }
};

  const handleView3D = async () => {
    // Capture current front view
    setView("front");
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for view to update
    const frontCapture = await captureDesignAsImage(canvasRef.current);
    
    // Capture current back view
    setView("back");
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for view to update
    const backCapture = await captureDesignAsImage(canvasRef.current);
    
    // Restore original view
    setView("front");

    // Navigate to 3D viewer with captured customized designs
    navigate(`/customize/${id}/3d-view`, { 
      state: { 
        frontImage: frontCapture || frontDataUrl, 
        backImage: backCapture || backDataUrl, 
        shirtColor,
        frontDesign,
        backDesign 
      } 
    });
  };

  const handleDownloadDesign = async () => {
  if (!downloadFormat) {
    alert("Please select a download format.");
    return;
  }

  const W = 800, H = 960;
  const canvasRect = canvasRef.current.getBoundingClientRect();
  const scaleX = W / canvasRect.width;
  const scaleY = H / canvasRect.height;

  try {
    const offscreen = document.createElement("canvas");
    offscreen.width = W;
    offscreen.height = H;
    const ctx = offscreen.getContext("2d");

    // Background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, W, H);

    // 1. Shirt image (already a data URL — no CORS issue)
    const shirtSrc = view === "front"
      ? (frontDataUrl || product?.frontImage)
      : (backDataUrl  || product?.backImage);

    if (shirtSrc) {
      try {
        const shirtImg = await loadImageCORS(shirtSrc);
        const scale = Math.min(W / shirtImg.width, H / shirtImg.height);
        const sw = shirtImg.width * scale;
        const sh = shirtImg.height * scale;
        ctx.drawImage(shirtImg, (W - sw) / 2, (H - sh) / 2, sw, sh);
      } catch (e) {
        console.warn("Shirt draw failed:", e.message);
      }
    }

    // 2. Stickers
    for (const sticker of selectedStickers.filter(s => s && s.id)) {
      const pos  = stickerPositions[sticker.id] || { x: 70, y: 70 };
      const size = (stickerSizes[sticker.id] || 80) * scaleX;
      const cx   = (pos.x / 100) * W;
      const cy   = (pos.y / 100) * H;

      if (sticker.emoji) {
        ctx.font = `${size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(sticker.emoji, cx, cy);
      } else if (sticker.url) {
        try {
          const img = await loadImageCORS(sticker.url);
          ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
        } catch (e) {
          console.warn(`Sticker ${sticker.id} skipped (CORS):`, e.message);
          // Grey placeholder
          ctx.fillStyle = "rgba(180,180,180,0.5)";
          ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
          ctx.fillStyle = "#888";
          ctx.font = "11px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("sticker", cx, cy);
        }
      }
    }

    // 3. Logo (base64 data URL — no CORS issue)
    if (logo) {
      try {
        const logoImg = await loadImageCORS(logo);
        const lx = (logoPos.x / 100) * W;
        const ly = (logoPos.y / 100) * H;
        const scaledLogoSize = logoSize * scaleX;
        ctx.drawImage(logoImg, lx - scaledLogoSize / 2, ly - scaledLogoSize / 2, scaledLogoSize, scaledLogoSize);      } catch (e) {
        console.warn("Logo draw failed:", e.message);
      }
    }

    // 4. Text (multi-line support)
    if (designText) {
      const tx = (textPos.x / 100) * W;
      const ty = (textPos.y / 100) * H;
      ctx.font = `bold ${fontSize * scaleX}px ${selectedFont}`;
      ctx.fillStyle = selectedColor || "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;

      const lines = designText.split("\n");
      const lineH = fontSize * 1.3;
      const startY = ty - (lines.length * lineH) / 2 + lineH / 2;
      lines.forEach((line, i) => ctx.fillText(line, tx, startY + i * lineH));

      ctx.shadowColor = "transparent";
    }

    // 5. Export
    const filename = `design_${view}_${new Date().toISOString().split("T")[0]}`;

    if (downloadFormat === "pdf") {
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [W, H] });
      pdf.addImage(offscreen.toDataURL("image/png"), "PNG", 0, 0, W, H);
      pdf.save(`${filename}.pdf`);

    } else if (downloadFormat === "jpg") {
      const jpgC = document.createElement("canvas");
      jpgC.width = W; jpgC.height = H;
      const jCtx = jpgC.getContext("2d");
      jCtx.fillStyle = "#fff";
      jCtx.fillRect(0, 0, W, H);
      jCtx.drawImage(offscreen, 0, 0);
      jpgC.toBlob(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}.jpg`;
        a.click();
      }, "image/jpeg", 0.95);

    } else {
      offscreen.toBlob(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}.png`;
        a.click();
      });
    }

    alert(`✅ Downloaded as ${downloadFormat.toUpperCase()}!`);
  } catch (err) {
    console.error("Download error:", err);
    alert("Download failed: " + err.message);
  }
};

  const filteredStickers = popularStickers.filter((sticker) => {
    const searchTerm = stickerSearch.toLowerCase();
    return (
      sticker.name.toLowerCase().includes(searchTerm) ||
      sticker.keywords.toLowerCase().includes(searchTerm)
    );
  });

  // ✅ CRITICAL FIX: Compute the correct stickers for the current view
  // This ensures we ALWAYS render stickers from the current side's design, never mix front/back
  const currentDesignStickers = view === "front" ? (frontDesign.selectedStickers || []) : (backDesign.selectedStickers || []);
  const currentStickerSizes = view === "front" ? (frontDesign.stickerSizes || {}) : (backDesign.stickerSizes || {});
  const currentStickerPositions = view === "front" ? (frontDesign.stickerPositions || {}) : (backDesign.stickerPositions || {});

  if (!product) {
    return <h2 style={{ textAlign: "center", padding: "50px" }}>Loading customization studio...</h2>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerSection}>
        <button style={styles.backBtn} onClick={() => navigate(`/product/${id}`)}>
          ← Back
        </button>
        <div style={styles.productInfo}>
          {(frontDataUrl || product?.frontImage || product?.image) && (
            <img
              src={frontDataUrl || product.frontImage || product.image}
              alt={product.name}
              style={styles.productImage}
            />
          )}
          <div>
            <h2 style={styles.productName}>{product?.name}</h2>
            <p style={styles.productPrice}>Rs.{product?.price}</p>
          </div>
        </div>
        <div style={styles.undoRedoButtons}>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            style={{...styles.undoBtn, opacity: historyIndex <= 0 ? 0.5 : 1, cursor: historyIndex <= 0 ? "not-allowed" : "pointer"}}
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            style={{...styles.redoBtn, opacity: historyIndex >= history.length - 1 ? 0.5 : 1, cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer"}}
          >
            ↷ Redo
          </button>
          <button
            onClick={handleReset}
            style={{...styles.resetBtn}}
          >
            ⟲ Reset
          </button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h3 style={styles.panelTitle}>Customize Your Design</h3>

          {/* ✅ ENHANCED: Product Available Colors - Dynamically Generated from Backend */}
          {availableColors && availableColors.length > 0 ? (
            <div style={styles.card}>
              <h4 style={styles.cardTitle}>
                🎨 Available Colors <span style={{fontSize: "12px", color: "#666"}}>({availableColors.length})</span>
              </h4>
              <div style={styles.colorGrid}>
                {availableColors.map((colorVariant) => (
                  <button
                    key={colorVariant.colorName}
                    onClick={() => handleProductColorSelect(colorVariant.colorName)}
                    style={{
                      ...styles.colorButton,
                      backgroundColor: colorVariant.colorCode,
                      border: selectedProductColor === colorVariant.colorName ? "3px solid #000" : "2px solid #ccc",
                      boxShadow: selectedProductColor === colorVariant.colorName ? "0 0 10px rgba(0,0,0,0.5)" : "0 2px 4px rgba(0,0,0,0.1)",
                      transform: selectedProductColor === colorVariant.colorName ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    title={`Select ${colorVariant.colorName} color`}
                    aria-label={`Select ${colorVariant.colorName} color`}
                  />
                ))}
              </div>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "10px", textAlign: "center" }}>
                Selected: <strong style={{color: "#000", fontSize: "13px"}}>{selectedProductColor}</strong>
              </p>
            </div>
          ) : (
            <div style={{...styles.card, backgroundColor: "#fff9e6", borderColor: "#ffd700", borderLeftWidth: "4px"}}>
              <p style={{ fontSize: "12px", color: "#FF8C00", margin: 0 }}>
                {product ? "No color variants added for this product." : "Loading product..."}
              </p>
            </div>
          )}

          {/* Text Color - Interactive Color Wheel */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Text Color</h4>
            <ColorWheel
              selectedColor={selectedColor}
              onColorSelect={(color) => setSelectedColor(color)}
            />
          </div>

          {/* Text Editor */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Add Text</h4>
            <textarea
              value={designText}
              onChange={(e) => setDesignText(e.target.value)}
              onKeyDown={(e) => {
                // ✅ Support Shift + Enter for manual line breaks
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  const textarea = e.currentTarget;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const newText = designText.substring(0, start) + "\n" + designText.substring(end);
                  setDesignText(newText);
                  // Move cursor after the new line
                  setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 1;
                  }, 0);
                }
              }}
              placeholder="Enter text (Shift+Enter for line breaks)"
              style={{
                ...styles.input,
                minHeight: "80px",
                fontFamily: "Arial, sans-serif",
                resize: "vertical",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
              }}
            />
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              💡 Tip: Press <strong>Shift+Enter</strong> to create a line break
            </p>
            <label style={styles.label}>Font</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              style={styles.select}
            >
              {fonts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label style={styles.label}>Font Size: {fontSize}px</label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          {/* Logo Upload */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Upload Logo</h4>
            <input type="file" accept="image/*,.svg" onChange={handleLogoUpload} style={styles.input} />
            {logo && (
              <div>
                <p style={styles.uploadedText}>✓ Logo uploaded (Size: {logoSize}px)</p>
                <p style={{fontSize: "11px", color: "#666", marginBottom: "8px"}}>Drag the corner handle on the logo to resize</p>
                <div style={styles.buttonGroup}>
                  <button
                    onClick={handleDeleteLogo}
                    style={{...styles.sizeBtn, backgroundColor: "#ff6b6b", color: "#fff"}}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sticker Gallery */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>🎨 Find Stickers</h4>
            <div style={styles.searchContainer}>
              <input
                type="text"
                value={stickerSearch}
                onChange={(e) => setStickerSearch(e.target.value)}
                placeholder="Search: birthday, love, fire, star..."
                style={{...styles.input, fontSize: "14px"}}
              />
              {stickerLoading && <div style={styles.loadingSpinner}>⏳ Loading...</div>}
                <div style={{marginTop:8}}>
                  <button
                    onClick={async () => {
                      const key = process.env.REACT_APP_PEXELS_API_KEY;
                      if (!key) {
                        setPexelsTestResult({ ok: false, message: 'No REACT_APP_PEXELS_API_KEY in frontend/.env' });
                        return;
                      }
                      try {
                        const res = await fetch(`https://api.pexels.com/v1/search?query=test&per_page=1`, { headers: { Authorization: key } });
                        if (!res.ok) {
                          const text = await res.text();
                          setPexelsTestResult({ ok: false, status: res.status, message: text.slice(0,200) });
                        } else {
                          const data = await res.json();
                          const photo = data.photos && data.photos[0];
                          setPexelsTestResult({ ok: true, status: res.status, url: photo && photo.src && (photo.src.medium || photo.src.small || photo.src.large) });
                        }
                      } catch (err) {
                        setPexelsTestResult({ ok: false, message: err.message });
                      }
                    }}
                    style={{...styles.sizeBtn, marginLeft: 8, padding: '8px 10px'}}
                  >
                    Test Pexels Key
                  </button>
                  {pexelsTestResult && (
                    <div style={{marginTop:6, fontSize:12}}>
                      {pexelsTestResult.ok ? (
                        <div style={{color:'#0a0'}}>
                          Pexels OK — status {pexelsTestResult.status}. <a href={pexelsTestResult.url} target="_blank" rel="noreferrer">Open sample</a>
                        </div>
                      ) : (
                        <div style={{color:'#a00'}}>Pexels failed — {pexelsTestResult.status || ''} {pexelsTestResult.message || ''}</div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            {/* API Stickers Results */}
            {apiStickers.length > 0 ? (
              <div>
                <h5 style={{margin: "10px 0 5px 0", fontSize: "12px", color: "#666"}}>Dynamic Results ({apiStickers.length})</h5>
                <div style={styles.stickerGrid}>
                  {apiStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => {
                        // ✅ FIX: Log sticker addition to debug front/back issue
                        console.log(`[STICKER ADD] Adding sticker to ${view} view:`, sticker.id);
                        // Add sticker to array if not already present
                        if (!selectedStickers.find((s) => s.id === sticker.id)) {
                          setSelectedStickers((prev) => {
                            const newStickers = [...prev, sticker];
                            console.log(`[STICKER ADD] New stickers array for ${view}:`, newStickers.map(s => s.id));
                            return newStickers;
                          });
                          // Initialize size for this sticker
                          setStickerSizes((prev) => ({
                            ...prev,
                            [sticker.id]: 80,
                          }));
                          // Initialize position for this sticker
                          setStickerPositions((prev) => ({
                            ...prev,
                            [sticker.id]: { x: 70 + (selectedStickers.length * 5), y: 70 + (selectedStickers.length * 5) },
                          }));
                        } else {
                          console.log(`[STICKER ADD] Sticker already exists in ${view} view:`, sticker.id);
                        }
                      }}
                      style={{
                        ...styles.stickerOption,
                        border: selectedStickers.find((s) => s.id === sticker.id) ? "3px solid #ff6b6b" : "1px solid #ddd",
                        backgroundColor: selectedStickers.find((s) => s.id === sticker.id) ? "#ffe0e0" : "#fff",
                        transition: "transform 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      title={sticker.name}
                    >
                      {sticker.emoji ? (
                        <span style={{ fontSize: "40px" }}>{sticker.emoji}</span>
                        ) : (
                        <img
                          src={sticker.url}
                          alt={sticker.name}
                          style={{ width: "50px", height: "50px", objectFit: "contain" }}
                          onError={(e) => {
                            // Fall back to Unsplash Source image for the same keyword
                            try {
                              e.currentTarget.onerror = null;
                              const fallback = `https://source.unsplash.com/200x200/?${encodeURIComponent(sticker.name || sticker.keywords || "design")}`;
                              e.currentTarget.src = fallback;
                            } catch (err) {
                              console.warn("sticker thumbnail fallback failed", err);
                            }
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : stickerSearch.trim() ? (
              <div style={{textAlign: "center", padding: "20px", color: "#999"}}>
                {stickerLoading ? (
                  <p>⏳ Loading stickers...</p>
                ) : (
                  <p>✨ Showing emoji stickers for "{stickerSearch}"</p>
                )}
              </div>
            ) : (
              <div>
                <h5 style={{margin: "10px 0 5px 0", fontSize: "12px", color: "#666"}}>Popular (Offline)</h5>
                <div style={styles.stickerGrid}>
                  {popularStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => {
                        // ✅ FIX: Log sticker addition to debug front/back issue
                        console.log(`[STICKER ADD] Adding popular sticker to ${view} view:`, sticker.id);
                        // Add sticker to array if not already present
                        if (!selectedStickers.find((s) => s.id === sticker.id)) {
                          setSelectedStickers((prev) => {
                            const newStickers = [...prev, sticker];
                            console.log(`[STICKER ADD] New stickers array for ${view}:`, newStickers.map(s => s.id));
                            return newStickers;
                          });
                          // Initialize size for this sticker
                          setStickerSizes((prev) => ({
                            ...prev,
                            [sticker.id]: 80,
                          }));
                          // Initialize position for this sticker
                          setStickerPositions((prev) => ({
                            ...prev,
                            [sticker.id]: { x: 70 + (selectedStickers.length * 5), y: 70 + (selectedStickers.length * 5) },
                          }));
                        } else {
                          console.log(`[STICKER ADD] Sticker already exists in ${view} view:`, sticker.id);
                        }
                      }}
                      style={{
                        ...styles.stickerOption,
                        border: selectedStickers.find((s) => s.id === sticker.id) ? "3px solid #ff6b6b" : "1px solid #ddd",
                        backgroundColor: selectedStickers.find((s) => s.id === sticker.id) ? "#ffe0e0" : "#fff",
                        transition: "transform 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      title={sticker.name}
                    >
                      <img src={sticker.url} alt={sticker.name} style={{ width: "50px", height: "50px" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedStickers.length > 0 && (
              <div>
                <p style={styles.selectedText}>✓ {selectedStickers.length} sticker(s) added</p>
                {selectedStickers.map((sticker) => (
                  <div key={sticker.id} style={{marginBottom: "12px", padding: "10px", border: selectedStickerId === sticker.id ? "2px solid #0b84ff" : "1px solid #ddd", borderRadius: "5px", backgroundColor: selectedStickerId === sticker.id ? "#e3f2fd" : "#fff", transition: "all 0.2s ease"}}>
                    <p style={{margin: "0 0 8px 0", fontSize: "12px", fontWeight: "bold"}}>{sticker.name} (Size: {Math.round(stickerSizes[sticker.id] || 80)}px)</p>
                    <div style={styles.buttonGroup}>
                      <p style={{margin: "0 0 8px 0", fontSize: "11px", color: "#666"}}>Drag the corner handle on the sticker to resize</p>
                      <button
                        onClick={() => {
                          handleDeleteSticker(sticker.id);
                          setSelectedStickerId(null);
                        }}
                        style={{...styles.sizeBtn, backgroundColor: "#ff6b6b", color: "#fff"}}
                        title="Delete sticker (or click ✕ icon on canvas / press Delete)"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div style={styles.centerPanel}>
          <h2 style={styles.centerTitle}>Design Preview</h2>

          {/* View Selector */}
          <div style={styles.viewSelector}>
            <button
              onClick={() => setView("front")}
              style={{
                ...styles.viewBtn,
                backgroundColor: view === "front" ? "#000" : "#fff",
                color: view === "front" ? "#fff" : "#000",
              }}
            >
              Front View
            </button>
            <button
              onClick={() => setView("back")}
              style={{
                ...styles.viewBtn,
                backgroundColor: view === "back" ? "#000" : "#fff",
                color: view === "back" ? "#fff" : "#000",
              }}
            >
              Back View
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            style={{
              ...styles.canvas,
              position: "relative",
              backgroundColor: "#f0f0f0",
              overflow: "hidden",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Product Image Background - Uses selected color variant image if available */}
            {(view === "front" ? frontDataUrl || product?.frontImage : backDataUrl || product?.backImage) && (
              <>
                {/* Check if product image is SVG (data URL or file extension) */}
                {isSVGImage(view === "front" ? frontDataUrl || product?.frontImage : backDataUrl || product?.backImage) ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  >
                    <SVGShirtContainer
                      svgUrl={view === "front" ? frontDataUrl || product?.frontImage : backDataUrl || product?.backImage}
                      shirtColor={shirtColor}
                      view={view}
                    />
                  </div>
                ) : (
                  <img
                    src={view === "front" ? frontDataUrl || product?.frontImage : backDataUrl || product?.backImage}
                    alt="product"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "none",
                      zIndex: 0,
                    }}
                  />
                )}
              </>
            )}

            {/* Design Text */}
            {designText && (
              <div
                onMouseDown={handleMouseDown}
                data-element="text"
                style={{
                  position: "absolute",
                  left: `${textPos.x}%`,
                  top: `${textPos.y}%`,
                  fontSize: `${fontSize}px`,
                  fontFamily: selectedFont,
                  fontWeight: "bold",
                  color: selectedColor,
                  textAlign: "center",
                  maxWidth: "350px",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  cursor: draggingElement === "text" ? "grabbing" : "grab",
                  transform: "translate(-50%, -50%)",
                  padding: "5px 10px",
                  userSelect: "none",
                  zIndex: draggingElement === "text" ? 1000 : 10,
                  lineHeight: "1.3",
                }}
              >
                {designText}
              </div>
            )}

            {/* Logo */}
            {logo && (
              <div
                style={{
                  position: "absolute",
                  left: `${logoPos.x}%`,
                  top: `${logoPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: draggingElement === "logo" ? 1000 : 10,
                }}
              >
                <img
                  src={logo}
                  alt="logo"
                  onMouseDown={handleMouseDown}
                  data-element="logo"
                  style={{
                    width: `${logoSize}px`,
                    height: `${logoSize}px`,
                    objectFit: "contain",
                    cursor: draggingElement === "logo" ? "grabbing" : "grab",
                    border: draggingElement === "logo" ? "2px solid #ff6b6b" : "none",
                    borderRadius: draggingElement === "logo" ? "4px" : "0",
                    userSelect: "none",
                    display: "block",
                    transition: "all 0.2s ease",
                  }}
                />

                {/* ✅ Resize Handle - Show on logo */}
                <div
                  onMouseDown={handleMouseDown}
                  data-element="logo-resize-"
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "-6px",
                    width: "16px",
                    height: "16px",
                    backgroundColor: "#0b84ff",
                    border: "2px solid #fff",
                    borderRadius: "2px",
                    cursor: "nwse-resize",
                    boxShadow: "0 2px 8px rgba(11,132,255,0.6)",
                    transition: "all 0.2s ease",
                    zIndex: 1001,
                  }}
                  title="Drag to resize"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0066cc";
                    e.currentTarget.style.transform = "scale(1.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0b84ff";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              </div>
            )}

            {/* Sticker */}
            {currentDesignStickers.map((sticker) => (
              <div
                key={sticker.id}
                style={{
                  position: "absolute",
                  left: `${(currentStickerPositions[sticker.id]?.x || 70)}%`,
                  top: `${(currentStickerPositions[sticker.id]?.y || 70)}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: selectedStickerId === sticker.id ? 1000 : (draggingElement === `sticker-${sticker.id}` ? 999 : 10),
                }}
                onMouseEnter={() => setSelectedStickerId(sticker.id)}
                onMouseLeave={() => {
                  if (!draggingElement?.includes(`sticker-${sticker.id}`)) {
                    setSelectedStickerId(null);
                  }
                }}
              >
                {sticker.emoji ? (
                  <div
                    onMouseDown={handleMouseDown}
                    data-element={`sticker-${sticker.id}`}
                    data-sticker-id={sticker.id}
                    style={{
                      position: "relative",
                      fontSize: `${currentStickerSizes[sticker.id] || 80}px`,
                      cursor: draggingElement === `sticker-${sticker.id}` ? "grabbing" : "grab",
                      userSelect: "none",
                      padding: selectedStickerId === sticker.id ? "8px" : "0",
                      border: selectedStickerId === sticker.id ? "2px dashed #ff6b6b" : "none",
                      borderRadius: "4px",
                      backgroundColor: selectedStickerId === sticker.id ? "rgba(255,107,107,0.1)" : "transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {sticker.emoji}
                  </div>
                ) : (
                  <img
                    src={sticker.url}
                    alt="sticker"
                    onMouseDown={handleMouseDown}
                    data-element={`sticker-${sticker.id}`}
                    data-sticker-id={sticker.id}
                    onError={(e) => {
                      try {
                        e.currentTarget.onerror = null;
                        const fallback = `https://source.unsplash.com/600x600/?${encodeURIComponent(sticker.name || sticker.keywords || "design")}`;
                        e.currentTarget.src = fallback;
                        // ✅ FIX: Update the current view's design stickers, not the shared array
                        if (view === "front") {
                          setFrontDesign((prev) => ({
                            ...prev,
                            selectedStickers: (prev.selectedStickers || []).map((s) =>
                              s.id === sticker.id ? { ...s, url: fallback } : s
                            ),
                          }));
                        } else {
                          setBackDesign((prev) => ({
                            ...prev,
                            selectedStickers: (prev.selectedStickers || []).map((s) =>
                              s.id === sticker.id ? { ...s, url: fallback } : s
                            ),
                          }));
                        }
                      } catch (err) {
                        console.warn("sticker canvas fallback failed", err);
                      }
                    }}
                    style={{
                      position: "relative",
                      width: `${currentStickerSizes[sticker.id] || 80}px`,
                      height: `${currentStickerSizes[sticker.id] || 80}px`,
                      objectFit: "contain",
                      cursor: draggingElement === `sticker-${sticker.id}` ? "grabbing" : "grab",
                      border: selectedStickerId === sticker.id ? "2px solid #ff6b6b" : "none",
                      borderRadius: selectedStickerId === sticker.id ? "4px" : "0",
                      boxShadow: selectedStickerId === sticker.id ? "0 0 8px rgba(255,107,107,0.5)" : "none",
                      userSelect: "none",
                      display: "block",
                      transition: "all 0.2s ease",
                    }}
                  />
                )}

                {/* ✅ Resize Handle - Show on selected sticker corner */}
                {selectedStickerId === sticker.id && (
                  <div
                    onMouseDown={handleMouseDown}
                    data-element={`sticker-resize-${sticker.id}`}
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      right: "-6px",
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#ff6b6b",
                      border: "2px solid #fff",
                      borderRadius: "2px",
                      cursor: "nwse-resize",
                      boxShadow: "0 2px 8px rgba(255,107,107,0.6)",
                      transition: "all 0.2s ease",
                      zIndex: 1001,
                    }}
                    title="Drag to resize"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff5252";
                      e.currentTarget.style.transform = "scale(1.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff6b6b";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                )}

                {/* ✅ Delete Icon Button - Show on hover */}
                {selectedStickerId === sticker.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSticker(sticker.id);
                      setSelectedStickerId(null);
                    }}
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#ff6b6b",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(255,107,107,0.4)",
                      transition: "all 0.2s ease",
                      zIndex: 1001,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff5252";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#ff6b6b";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Delete sticker (or press Delete key)"
                  >
                    ✕
                  </button>
                )}


              </div>
            ))}
          </div>

          {/* Download Design - Below Canvas */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>💾 Save Design</h4>
            <label style={styles.label}>Download Format</label>
         <select
  value={downloadFormat}
  onChange={(e) => setDownloadFormat(e.target.value)}
  style={styles.select}
>
  <option value="" disabled>
    Select downloading format
  </option>

  <option value="png">PNG</option>
  <option value="jpg">JPG</option>
  <option value="pdf">PDF</option>
</select>

            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Current view: <strong>{view.toUpperCase()}</strong>
            </p>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px'}}>
              <button onClick={handleDownloadDesign} style={styles.downloadBtn}>
                ⬇️ Download Design
              </button>
              <button 
                onClick={handleView3D}
                style={{...styles.downloadBtn, backgroundColor: '#6366f1'}}
              >
                📱 View in 3D
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <h3 style={styles.panelTitle}>Order Details</h3>

          {/* Customization Price Breakdown */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Customization Charges</h4>
            <div style={styles.priceBreakdown}>
              {designText.length > 0 && (
                <div style={styles.priceRow}>
                  <span>📝 Text Design</span>
                  <span>Rs.200</span>
                </div>
              )}
              {logo && (
                <div style={styles.priceRow}>
                  <span>🏷️ Logo Upload</span>
                  <span>Rs.300</span>
                </div>
              )}
              {selectedStickers.length > 0 && (
                <div style={styles.priceRow}>
                  <span>✨ Stickers ({selectedStickers.length})</span>
                  <span>Rs.{150 * selectedStickers.length}</span>
                </div>
              )}
              {calculateCustomizationPrice() === 0 && (
                <div style={styles.priceRow}>
                  <span>No customization yet</span>
                  <span>Rs.0</span>
                </div>
              )}
              <div style={styles.priceDivider}></div>
              <div style={styles.totalCustomPrice}>
                <span>{view === "front" ? "Front" : "Back"} Side</span>
                <span>Rs.{calculateCustomizationPrice()}</span>
              </div>
            </div>
          </div>

          {/* Total Customization Charges (Front + Back) */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>💰 Total Customization (Front + Back)</h4>
            <div style={styles.priceBreakdown}>
              <div style={styles.priceRow}>
                <span>Front Side Charges</span>
                <span>Rs.{calculateDesignPrice(frontDesign)}</span>
              </div>
              <div style={styles.priceRow}>
                <span>Back Side Charges</span>
                <span>Rs.{calculateDesignPrice(backDesign)}</span>
              </div>
              <div style={styles.priceDivider}></div>
              <div style={{...styles.totalCustomPrice, backgroundColor: "#fff3cd", padding: "12px", borderRadius: "5px"}}>
                <span style={{fontWeight: "bold", fontSize: "16px"}}>Total Charges</span>
                <span style={{fontWeight: "bold", fontSize: "18px", color: "#ff6b6b"}}>Rs.{getTotalCharges()}</span>
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Select Size</h4>
            <div style={styles.buttonGroup}>
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    ...styles.sizeBtn,
                    backgroundColor: selectedSize === size ? "#000" : "#fff",
                    color: selectedSize === size ? "#fff" : "#000",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Quantity</h4>
            <div style={styles.quantityControl}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityBtn}
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={styles.quantityInput}
              />
              <button onClick={() => setQuantity(quantity + 1)} style={styles.quantityBtn}>
                +
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div style={styles.card}>
            <h4 style={styles.cardTitle}>Special Instructions</h4>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Any special requests?"
              style={styles.textarea}
            />
          </div>

          {/* Action Buttons */}
          <button onClick={handleAddToCart} style={styles.addToCartBtn}>
            🛒 Add to Cart
          </button>
          <button onClick={() => navigate("/products")} style={styles.continuShoppingBtn}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  backBtn: {
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
    fontSize: "14px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "20px",
    alignItems: "start",
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  centerPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#000",
  },
  card: {
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#000",
  },
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
  },
  colorButton: {
    width: "100%",
    height: "40px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "bold",
    marginTop: "10px",
    marginBottom: "5px",
    color: "#333",
  },
  select: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "14px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  slider: {
    width: "100%",
    cursor: "pointer",
  },
  uploadedText: {
    fontSize: "12px",
    color: "#4CAF50",
    fontWeight: "bold",
    margin: "10px 0",
  },
  buttonGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  materialBtn: {
    padding: "10px",
    border: "2px solid #ddd",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  centerTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  viewSelector: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  viewBtn: {
    padding: "10px 20px",
    border: "2px solid #000",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  canvas: {
    width: "100%",
    height: "500px",
    border: "2px solid #ddd",
    borderRadius: "10px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sizeBtn: {
    padding: "10px",
    border: "2px solid #ddd",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  quantityControl: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  quantityBtn: {
    padding: "8px 12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  quantityInput: {
    flex: 1,
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    textAlign: "center",
    fontSize: "14px",
  },
  priceBreakdown: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  priceRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#333",
  },
  priceDivider: {
    height: "1px",
    backgroundColor: "#ddd",
    margin: "5px 0",
  },
  totalCustomPrice: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#000",
    paddingTop: "5px",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "12px",
    minHeight: "80px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },
  resetBtn: {
    padding: "12px",
    backgroundColor: "#fff",
    color: "#000",
    border: "2px solid #000",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  downloadBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#FF6B6B",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "all 0.2s",
  },
  addToCartBtn: {
    padding: "12px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  continuShoppingBtn: {
    padding: "12px",
    backgroundColor: "#f0f0f0",
    color: "#000",
    border: "1px solid #ddd",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
  stickerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    marginBottom: "10px",
  },
  stickerOption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "#fff",
    transition: "all 0.2s",
  },
  selectedText: {
    fontSize: "12px",
    color: "#4CAF50",
    fontWeight: "bold",
    margin: "10px 0",
  },
  headerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  productInfo: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flex: 1,
  },
  productImage: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  productName: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#000",
    margin: "0 0 5px 0",
  },
  productPrice: {
    fontSize: "14px",
    color: "#ff6b6b",
    fontWeight: "bold",
    margin: "0",
  },
  undoRedoButtons: {
    display: "flex",
    gap: "10px",
  },
  undoBtn: {
    padding: "10px 15px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  redoBtn: {
    padding: "10px 15px",
    backgroundColor: "#2196F3",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  resetBtn: {
    padding: "10px 15px",
    backgroundColor: "#ff6b6b",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "10px",
  },
  loadingSpinner: {
    textAlign: "center",
    padding: "10px",
    color: "#666",
    fontSize: "12px",
    fontWeight: "bold",
  },
};
