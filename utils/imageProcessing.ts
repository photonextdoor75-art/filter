
export type FilterType = 
  'newspaper-bw' | 
  'aged-gazette' | 
  '70s-mag' | 
  '80s-pop' | 
  '90s-washed' | 
  'bad-photocopy' |
  'mimeograph' |
  'blueprint' |
  'misaligned' |
  'thermal' |
  'vhs-worn' |
  'dv-cam' |
  'comics-60s' |
  'comics-80s' |
  'polaroid-1' |
  'polaroid-2' |
  'polaroid-3';

/**
 * Applies a vintage/retro newspaper filter to a base64 image string locally using HTML5 Canvas.
 * This bypasses any API safety filters and works offline.
 */
export const applyRetroFilter = async (base64Input: string, filterType: FilterType = 'aged-gazette'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // --- PIXEL MANIPULATION ENGINE ---
        
        if (filterType === 'aged-gazette') {
          applyAgedGazette(data);
        } else if (filterType === 'newspaper-bw') {
          applyNewspaperBW(data);
        } else if (filterType === '70s-mag') {
          apply70sMagazine(data);
        } else if (filterType === 'bad-photocopy') {
          applyBadPhotocopy(data);
        } else if (filterType === '80s-pop') {
          apply80sGlossy(data);
        } else if (filterType === '90s-washed') {
          apply90sGrunge(data);
        } else if (filterType === 'mimeograph') {
          applyMimeograph(data);
        } else if (filterType === 'blueprint') {
          applyBlueprint(data);
        } else if (filterType === 'thermal') {
          applyThermal(data);
        } else if (filterType === 'dv-cam') {
          applyDV(data, canvas.width, canvas.height);
        } else if (filterType === 'comics-60s') {
          applyComics60s(data, canvas.width, canvas.height);
        } else if (filterType === 'polaroid-1') {
          applyPolaroid1(data);
        } else if (filterType === 'polaroid-2') {
          applyPolaroid2(data);
        } else if (filterType === 'polaroid-3') {
          applyPolaroid3(data);
        }
        
        // Filters requiring source copy (Convolution or Offset)
        if (filterType === 'misaligned') {
          const copy = new Uint8ClampedArray(data);
          applyMisaligned(data, copy, canvas.width, canvas.height);
        } else if (filterType === 'vhs-worn') {
          const copy = new Uint8ClampedArray(data);
          applyVHS(data, copy, canvas.width, canvas.height);
        } else if (filterType === 'comics-80s') {
           const copy = new Uint8ClampedArray(data);
           applyComics80s(data, copy, canvas.width, canvas.height);
        }

        ctx.putImageData(imageData, 0, 0);

        // --- POST-PROCESSING (Overlays & Frames) ---
        
        const isPolaroid = filterType.startsWith('polaroid');

        // 1. Vignette (Skip for polaroid here, applied differently)
        const heavyVignette = ['blueprint', 'thermal', 'vhs-worn', 'comics-80s'].includes(filterType);
        if (!isPolaroid && filterType !== '80s-pop' && filterType !== 'bad-photocopy' && filterType !== 'dv-cam' && filterType !== 'comics-60s') {
           applyVignette(ctx, canvas.width, canvas.height, heavyVignette ? 0.6 : 0.2);
        }

        // 2. Polaroid Specific Softness & Bleed (BEFORE Framing)
        if (isPolaroid) {
           // Apply heavy vignette on the photo itself
           applyVignette(ctx, canvas.width, canvas.height, 0.5);
           // Apply chemical bleed / softness
           applyPolaroidSoftness(ctx, canvas.width, canvas.height, filterType);
        }

        // 3. Scratches & Dust
        const scratchyFilters = ['aged-gazette', 'bad-photocopy', 'thermal', 'blueprint', 'comics-60s'];
        if (scratchyFilters.includes(filterType)) {
          applyScratches(ctx, canvas.width, canvas.height, filterType === 'thermal');
        }

        // 4. VHS / Video Specific Overlays
        if (filterType === 'vhs-worn') {
          applyTrackingNoise(ctx, canvas.width, canvas.height);
        } else if (filterType === 'dv-cam') {
          applyDateStamp(ctx, canvas.width, canvas.height);
        }
        
        // 5. POLAROID FRAME COMPOSITION (Returns new canvas)
        if (isPolaroid) {
            const framedCanvas = composePolaroidFrame(canvas, filterType);
            resolve(framedCanvas.toDataURL('image/jpeg', 0.90));
            return;
        }

        // Return as JPEG
        resolve(canvas.toDataURL('image/jpeg', 0.90));
      } catch (e) {
        reject(e);
      }
    };
    
    img.onerror = (e) => {
      reject(new Error("Failed to load image for processing."));
    };

    img.src = base64Input;
  });
};

// --- POLAROID HELPERS ---

function applyPolaroidSoftness(ctx: CanvasRenderingContext2D, w: number, h: number, filterType: string) {
    // Simulates the "perte de finition" and "couleurs baveuses"
    
    // 1. Blur slightly to lose digital sharpness
    const blurAmount = Math.max(1, w * 0.002); // Scale blur with resolution
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'none';

    // 2. Chemical Bleed / Glow (Bloom)
    // Draw a blurred, saturated version on top to simulate ink spread
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light'; // or overlay
    ctx.globalAlpha = 0.5;
    ctx.filter = `blur(${blurAmount * 3}px) saturate(120%)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
    
    // 3. Slight texture overlay for the photo surface
    if (filterType === 'polaroid-2') {
       // Add some "milkiness" for expired film
       ctx.fillStyle = 'rgba(255, 200, 200, 0.1)';
       ctx.globalCompositeOperation = 'screen';
       ctx.fillRect(0,0,w,h);
       ctx.globalCompositeOperation = 'source-over';
    }
}

function composePolaroidFrame(sourceCanvas: HTMLCanvasElement, filterType: string): HTMLCanvasElement {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    
    // Classic Polaroid Dimensions Logic
    // Frame side borders ~ 8% of image width
    const borderSize = Math.floor(Math.min(w, h) * 0.08);
    const bottomSize = Math.floor(Math.min(w, h) * 0.35); // Iconic thick bottom
    
    const frameW = w + (borderSize * 2);
    const frameH = h + borderSize + bottomSize;
    
    const canvas = document.createElement('canvas');
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return sourceCanvas;

    // 1. Draw Aged Paper Frame Background
    // Base color depending on filter
    let baseColor = '#fdfbf7'; // Default clean-ish
    let noiseIntensity = 0.05;
    
    if (filterType === 'polaroid-2') {
      baseColor = '#f4efe1'; // Yellowed/Aged
      noiseIntensity = 0.15;
    } else if (filterType === 'polaroid-3') {
      baseColor = '#f0f4f7'; // Cool/Dirty
      noiseIntensity = 0.08;
    }
    
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, frameW, frameH);
    
    // Add Paper Texture/Dirt to Frame
    addPaperTexture(ctx, frameW, frameH, noiseIntensity);

    // 2. Draw Inner Shadow (Depth of photo inset)
    // We draw the shadow rect where the image will be
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = borderSize / 2;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#000'; 
    ctx.fillRect(borderSize, borderSize, w, h);
    
    // 3. Draw the Photo
    ctx.shadowColor = 'transparent'; // Reset shadow
    ctx.drawImage(sourceCanvas, borderSize, borderSize);
    
    // 4. Authentic "Ridge" Highlight (Top edge of photo cutout)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(borderSize, borderSize + h);
    ctx.lineTo(borderSize, borderSize);
    ctx.lineTo(borderSize + w, borderSize);
    ctx.stroke();

    // 5. Dark Ridge (Bottom/Right edge of photo cutout)
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.moveTo(borderSize, borderSize + h);
    ctx.lineTo(borderSize + w, borderSize + h);
    ctx.lineTo(borderSize + w, borderSize);
    ctx.stroke();

    return canvas;
}

function addPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
    const imgData = ctx.getImageData(0,0,w,h);
    const d = imgData.data;
    for(let i=0; i<d.length; i+=4) {
        // Subtle grain
        if (Math.random() > 0.5) {
            const noise = (Math.random() - 0.5) * 30 * intensity;
            d[i] += noise;
            d[i+1] += noise;
            d[i+2] += noise; 
        }
    }
    ctx.putImageData(imgData, 0, 0);
    
    // Add Stains for "Vieilli" look
    if (intensity > 0.1) {
        ctx.globalCompositeOperation = 'multiply';
        const numStains = Math.floor(Math.random() * 4) + 1;
        for(let k=0; k<numStains; k++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * (w * 0.3) + 20;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(160, 140, 100, 0.15)'); // Brownish stain
            grad.addColorStop(1, 'rgba(160, 140, 100, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }
}

// --- FILTER ALGORITHMS ---

function applyAgedGazette(data: Uint8ClampedArray) {
  const paperColor = { r: 245, g: 238, b: 215 }; 
  const inkColor = { r: 45, g: 40, b: 40 };      
  const noiseAmount = 20;
  const contrast = 1.5;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const noise = (Math.random() - 0.5) * noiseAmount;
    let val = (gray + noise - 128) * contrast + 128;
    val = Math.max(0, Math.min(255, val));
    const t = val / 255;
    
    data[i] = inkColor.r + (paperColor.r - inkColor.r) * t;
    data[i + 1] = inkColor.g + (paperColor.g - inkColor.g) * t;
    data[i + 2] = inkColor.b + (paperColor.b - inkColor.b) * t;
  }
}

function applyNewspaperBW(data: Uint8ClampedArray) {
  const noiseAmount = 30;
  const contrast = 2.0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const noise = (Math.random() - 0.5) * noiseAmount;
    let val = (gray + noise - 128) * contrast + 128;
    val = Math.max(15, Math.min(245, val));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

function apply70sMagazine(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * 1.08 + 10; 
    g = g * 1.02 + 5;
    b = b * 0.92; 

    r = (r * 0.85) + 25; 
    g = (g * 0.85) + 25;
    b = (b * 0.85) + 25;

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const saturation = 0.85; 
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;
    
    data[i] = Math.min(255, Math.max(0, r));     
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b)); 
  }
}

function apply80sGlossy(data: Uint8ClampedArray) {
  const contrast = 1.3;
  const saturation = 1.6; 
  const brightness = 15;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const gray = (r + g + b) / 3;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    r = ((r - 128) * contrast + 128) + brightness;
    g = ((g - 128) * contrast + 128) + brightness;
    b = ((b - 128) * contrast + 128) + brightness;

    if (r > 235) r = 255;
    if (g > 235) g = 255;
    if (b > 235) b = 255;
    
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }
}

function apply90sGrunge(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * 0.95;
    g = g * 1.05; 
    b = b * 1.02;

    if (r < 100) r = r * 0.85; else r = r * 1.15;
    if (g < 100) g = g * 0.85; else g = g * 1.15;
    if (b < 100) b = b * 0.85; else b = b * 1.15;

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }
}

function applyBadPhotocopy(data: Uint8ClampedArray) {
  const threshold = 110;
  const noiseAmount = 60;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const noise = (Math.random() - 0.5) * noiseAmount;
    const val = (gray + noise) > threshold ? 255 : 20; 
    
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

function applyMimeograph(data: Uint8ClampedArray) {
  const inkR = 60, inkG = 20, inkB = 120; 
  const paperR = 240, paperG = 240, paperB = 255; 
  const noiseAmount = 15;
  const contrast = 1.5;

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray += (Math.random() - 0.5) * noiseAmount;
    gray = (gray - 128) * contrast + 128;
    gray = Math.max(0, Math.min(255, gray));
    
    const t = gray / 255; 

    data[i] = inkR + (paperR - inkR) * t;
    data[i + 1] = inkG + (paperG - inkG) * t;
    data[i + 2] = inkB + (paperB - inkB) * t;
  }
}

function applyBlueprint(data: Uint8ClampedArray) {
  const darkR = 0, darkG = 30, darkB = 85; 
  const lightR = 230, lightG = 240, lightB = 255; 

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray = (gray - 128) * 2.0 + 128;
    gray = Math.max(0, Math.min(255, gray));

    const t = gray / 255;

    data[i] = darkR + (lightR - darkR) * t;
    data[i + 1] = darkG + (lightG - darkG) * t;
    data[i + 2] = darkB + (lightB - darkB) * t;
  }
}

function applyThermal(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray += (Math.random() - 0.5) * 30;
    const threshold = 130;
    let val = gray > threshold ? 240 : 20; 
    if (Math.random() > 0.99) { val = 200; } 

    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

function applyMisaligned(data: Uint8ClampedArray, source: Uint8ClampedArray, w: number, h: number) {
  const offset = Math.max(2, Math.floor(w * 0.006)); 

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      let r;
      if (x + offset < w) {
        const iOff = (y * w + (x + offset)) * 4;
        r = source[iOff]; 
      } else {
        r = source[i];
      }

      let g = source[i + 1];

      let b;
      if (x - offset >= 0) {
         const iOff = (y * w + (x - offset)) * 4;
         b = source[iOff + 2];
      } else {
         b = source[i + 2];
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
}

function applyVHS(data: Uint8ClampedArray, source: Uint8ClampedArray, w: number, h: number) {
  const shiftR = Math.floor(w * 0.01); 
  const shiftB = Math.floor(w * -0.005);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      let r;
      const xR = Math.min(w - 1, x + shiftR);
      r = source[(y * w + xR) * 4];

      let b;
      const xB = Math.max(0, x + shiftB);
      b = source[(y * w + xB) * 4 + 2];

      let g = source[i + 1];

      r = (r - 20) * 1.2;
      g = (g - 20) * 1.2;
      b = (b - 20) * 1.2;

      const gray = (r * 0.3 + g * 0.59 + b * 0.11);
      r = gray + (r - gray) * 0.8;
      g = gray + (g - gray) * 0.8;
      b = gray + (b - gray) * 0.8;

      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }
  }
}

function applyDV(data: Uint8ClampedArray, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    const isOddLine = y % 2 !== 0;
    
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      b = b * 1.05;
      r = r * 0.98;

      if (isOddLine) {
        r *= 0.75;
        g *= 0.75;
        b *= 0.75;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }
  }
}

function applyComics60s(data: Uint8ClampedArray, w: number, h: number) {
  const dotSize = 4; 
  const paperYellow = { r: 245, g: 235, b: 210 };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      r = Math.floor(r / 64) * 64;
      g = Math.floor(g / 64) * 64;
      b = Math.floor(b / 64) * 64;

      const gray = (r+g+b)/3;
      r = gray + (r - gray) * 1.5;
      g = gray + (g - gray) * 1.5;
      b = gray + (b - gray) * 1.5;
      
      const gridX = x % dotSize;
      const gridY = y % dotSize;
      const centerX = dotSize / 2;
      const centerY = dotSize / 2;
      
      const dist = Math.sqrt((gridX - centerX)**2 + (gridY - centerY)**2);
      
      const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
      const threshold = (1 - luminance) * (dotSize / 1.2);

      if (dist < threshold) {
         r = 20; g = 20; b = 40;
      } else {
         r = Math.min(255, r + (paperYellow.r - 255) * 0.2);
         g = Math.min(255, g + (paperYellow.g - 255) * 0.2);
         b = Math.min(255, b + (paperYellow.b - 255) * 0.2);
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }
  }
}

function applyComics80s(data: Uint8ClampedArray, source: Uint8ClampedArray, w: number, h: number) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      
      let isEdge = false;
      if (x < w - 1 && y < h - 1) {
        const right = (source[(y * w + (x + 1)) * 4] + source[(y * w + (x + 1)) * 4 + 1] + source[(y * w + (x + 1)) * 4 + 2]) / 3;
        const bottom = (source[((y + 1) * w + x) * 4] + source[((y + 1) * w + x) * 4 + 1] + source[((y + 1) * w + x) * 4 + 2]) / 3;
        const current = (source[i] + source[i+1] + source[i+2]) / 3;
        
        if (Math.abs(current - right) > 30 || Math.abs(current - bottom) > 30) {
          isEdge = true;
        }
      }

      if (isEdge) {
        data[i] = 10;
        data[i+1] = 10;
        data[i+2] = 15;
      } else {
         let r = source[i];
         let g = source[i+1];
         let b = source[i+2];

         const gray = (r+g+b)/3;
         r = gray + (r - gray) * 1.4;
         g = gray + (g - gray) * 1.4;
         b = gray + (b - gray) * 1.4;

         r = (r - 128) * 1.2 + 128;
         g = (g - 128) * 1.2 + 128;
         b = (b - 128) * 1.2 + 128;

         data[i] = Math.max(0, Math.min(255, r));
         data[i+1] = Math.max(0, Math.min(255, g));
         data[i+2] = Math.max(0, Math.min(255, b));
      }
    }
  }
}

function applyPolaroid1(data: Uint8ClampedArray) {
  // Polaroid 600: Warm, Yellow/Greenish Shadows, Creamy highlights
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // Lift Blacks (Fade) to Dark Gray
    // Input 0 becomes 25
    r = 25 + (r * 0.85);
    g = 25 + (g * 0.85);
    b = 25 + (b * 0.85);

    // Warm Tint (R+, B-)
    r += 20;
    g += 10;
    b -= 5;

    // Shadow tinting (Greenish shadows)
    if (r < 100) {
       g += 5;
       b += 5;
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }
}

function applyPolaroid2(data: Uint8ClampedArray) {
    // Expired Film: Low contrast, Magenta chemical shift, "Milky"
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        
        // Heavy Fade (Milky look)
        r = 40 + (r * 0.75);
        g = 40 + (g * 0.75);
        b = 40 + (b * 0.75);

        // Magenta Shift (R++, B+, G--)
        r += 15;
        b += 10;
        g -= 10;

        data[i] = Math.min(255, Math.max(0, r));
        data[i+1] = Math.min(255, Math.max(0, g));
        data[i+2] = Math.min(255, Math.max(0, b));
    }
}

function applyPolaroid3(data: Uint8ClampedArray) {
    // Cool/Spectra: High contrast, Blue/Cyan bias, Crushed blacks
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        
        // High Contrast (S-Curve approx)
        r = (r - 128) * 1.2 + 128;
        g = (g - 128) * 1.2 + 128;
        b = (b - 128) * 1.2 + 128;

        // Cool Shift (B++, R-)
        b += 20;
        r -= 10;

        // Desaturate slightly
        const gray = (r+g+b)/3;
        r = gray + (r - gray) * 0.8;
        g = gray + (g - gray) * 0.8;
        b = gray + (b - gray) * 0.8;

        data[i] = Math.min(255, Math.max(0, r));
        data[i+1] = Math.min(255, Math.max(0, g));
        data[i+2] = Math.min(255, Math.max(0, b));
    }
}


// --- CANVAS DRAWING HELPERS ---

function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  ctx.globalCompositeOperation = 'multiply';
  const radius = Math.max(w, h) / 1.5;
  const gradient = ctx.createRadialGradient(w/2, h/2, w/5, w/2, h/2, radius);
  gradient.addColorStop(0, `rgba(0,0,0,0)`);
  gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

function applyScratches(ctx: CanvasRenderingContext2D, w: number, h: number, extreme: boolean = false) {
  ctx.globalCompositeOperation = 'screen'; 
  ctx.strokeStyle = extreme ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  
  const numScratches = Math.floor((w * h) / 50000);
  ctx.beginPath();
  for (let i = 0; i < numScratches; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = Math.random() * 50 + 10;
    const angle = (Math.random() - 0.5) * Math.PI / 4 + (Math.PI / 2);
    
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function applyTrackingNoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bandHeight = h * 0.15; // Bottom 15%
  const bandY = h - bandHeight;
  
  // 1. Tracking Band (Bottom)
  const imgData = ctx.createImageData(w, bandHeight);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = Math.random() > 0.5 ? 255 : 0;
    if (Math.random() > 0.3) {
       d[i] = noise;
       d[i+1] = noise;
       d[i+2] = noise;
       d[i+3] = 100; // Alpha
    } else {
       d[i+3] = 0;
    }
  }
  ctx.putImageData(imgData, 0, bandY);

  // 2. Random Glitch Lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i=0; i<5; i++) {
    const y = Math.random() * h;
    const hLine = Math.random() * 3 + 1;
    ctx.fillRect(0, y, w, hLine);
  }
}

function applyDateStamp(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fontSize = Math.max(16, Math.floor(h * 0.05));
  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = '#ff9900'; 
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 2;
  
  const year = 1998 + Math.floor(Math.random() * 8);
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28);
  const hour = Math.floor(Math.random() * 24);
  const min = Math.floor(Math.random() * 60);
  
  const dateStr = `${month.toString().padStart(2,'0')} ${day.toString().padStart(2,'0')} ${year}  ${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
  
  ctx.fillText(dateStr, w * 0.05, h * 0.95);
}
