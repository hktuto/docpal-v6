import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  Result,
} from '@zxing/library';

/**
 * QR Code type enum
 */
export enum QRCodeType {
  QR_CODE = 'QR_CODE',
  AZTEC = 'AZTEC',
  CODABAR = 'CODABAR',
  CODE_39 = 'CODE_39',
  CODE_93 = 'CODE_93',
  CODE_128 = 'CODE_128',
  DATA_MATRIX = 'DATA_MATRIX',
  EAN_8 = 'EAN_8',
  EAN_13 = 'EAN_13',
  ITF = 'ITF',
  PDF_417 = 'PDF_417',
  RSS_14 = 'RSS_14',
  RSS_EXPANDED = 'RSS_EXPANDED',
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  UPC_EAN_EXTENSION = 'UPC_EAN_EXTENSION',
  MAXICODE = 'MAXICODE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Result of QR code decoding
 */
export interface QRCodeResult {
  /** The type of barcode/QR code detected */
  type: QRCodeType;
  /** The decoded value */
  value: string;
  /** Raw ZXing result (for advanced use cases) */
  rawResult?: Result;
}

/**
 * Options for QR code reading
 */
export interface QRCodeReaderOptions {
  /** Specific formats to try (defaults to all) */
  formats?: BarcodeFormat[];
  /** Whether to try harder to find codes (slower but more accurate) */
  tryHarder?: boolean;
  /** Character set to use for decoding */
  characterSet?: string;
}

/**
 * Map ZXing BarcodeFormat to our QRCodeType
 */
function mapBarcodeFormat(format: BarcodeFormat): QRCodeType {
  const formatMap: Record<BarcodeFormat, QRCodeType> = {
    [BarcodeFormat.AZTEC]: QRCodeType.AZTEC,
    [BarcodeFormat.CODABAR]: QRCodeType.CODABAR,
    [BarcodeFormat.CODE_39]: QRCodeType.CODE_39,
    [BarcodeFormat.CODE_93]: QRCodeType.CODE_93,
    [BarcodeFormat.CODE_128]: QRCodeType.CODE_128,
    [BarcodeFormat.DATA_MATRIX]: QRCodeType.DATA_MATRIX,
    [BarcodeFormat.EAN_8]: QRCodeType.EAN_8,
    [BarcodeFormat.EAN_13]: QRCodeType.EAN_13,
    [BarcodeFormat.ITF]: QRCodeType.ITF,
    [BarcodeFormat.MAXICODE]: QRCodeType.MAXICODE,
    [BarcodeFormat.PDF_417]: QRCodeType.PDF_417,
    [BarcodeFormat.QR_CODE]: QRCodeType.QR_CODE,
    [BarcodeFormat.RSS_14]: QRCodeType.RSS_14,
    [BarcodeFormat.RSS_EXPANDED]: QRCodeType.RSS_EXPANDED,
    [BarcodeFormat.UPC_A]: QRCodeType.UPC_A,
    [BarcodeFormat.UPC_E]: QRCodeType.UPC_E,
    [BarcodeFormat.UPC_EAN_EXTENSION]: QRCodeType.UPC_EAN_EXTENSION,
  };
  return formatMap[format] || QRCodeType.UNKNOWN;
}

/**
 * Create a BinaryBitmap from image data
 */
function createBinaryBitmap(
  imageData: ImageData,
  width: number,
  height: number
): BinaryBitmap {
  const luminanceSource = {
    getWidth: () => width,
    getHeight: () => height,
    getRow: (y: number, row?: Uint8ClampedArray): Uint8ClampedArray => {
      const start = y * width * 4;
      const result = row || new Uint8ClampedArray(width);
      for (let x = 0; x < width; x++) {
        const offset = start + x * 4;
        // Convert RGB to luminance
        const r = imageData.data[offset];
        const g = imageData.data[offset + 1];
        const b = imageData.data[offset + 2];
        result[x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      }
      return result;
    },
    getMatrix: (): Uint8ClampedArray => {
      const matrix = new Uint8ClampedArray(width * height);
      for (let y = 0; y < height; y++) {
        const start = y * width * 4;
        for (let x = 0; x < width; x++) {
          const offset = start + x * 4;
          const r = imageData.data[offset];
          const g = imageData.data[offset + 1];
          const b = imageData.data[offset + 2];
          matrix[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }
      }
      return matrix;
    },
    isCropSupported: () => false,
    crop: () => {
      throw new Error('Crop not supported');
    },
    isRotateSupported: () => false,
    rotateCounterClockwise: () => {
      throw new Error('Rotate not supported');
    },
    rotateCounterClockwise45: () => {
      throw new Error('Rotate 45 not supported');
    },
    invert: () => {
      throw new Error('Invert not supported');
    },
  };

  return new BinaryBitmap(new HybridBinarizer(luminanceSource as any));
}

/**
 * Read QR code from an HTMLImageElement, HTMLCanvasElement, or ImageData
 * @param source - The image source to decode
 * @param options - Optional configuration for decoding
 * @returns Promise<QRCodeResult | null> - The decoded result or null if no code found
 */
export async function readQRCode(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string,
  options: QRCodeReaderOptions = {}
): Promise<QRCodeResult | null> {
  const { formats, tryHarder = true, characterSet } = options;

  // Create hints for the reader
  const hints = new Map<DecodeHintType, any>();
  
  if (formats && formats.length > 0) {
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  }
  
  if (tryHarder) {
    hints.set(DecodeHintType.TRY_HARDER, true);
  }
  
  if (characterSet) {
    hints.set(DecodeHintType.CHARACTER_SET, characterSet);
  }

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  let imageData: ImageData;
  let width: number;
  let height: number;

  try {
    // Handle different source types
    if (typeof source === 'string') {
      // URL or data URL - load image first
      const img = await loadImage(source);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, img.width, img.height);
      width = img.width;
      height = img.height;
    } else if (source instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      ctx.drawImage(source, 0, 0);
      imageData = ctx.getImageData(0, 0, source.width, source.height);
      width = source.width;
      height = source.height;
    } else if (source instanceof HTMLCanvasElement) {
      const ctx = source.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      imageData = ctx.getImageData(0, 0, source.width, source.height);
      width = source.width;
      height = source.height;
    } else if (source instanceof ImageData) {
      imageData = source;
      width = source.width;
      height = source.height;
    } else {
      throw new Error('Unsupported source type');
    }

    const binaryBitmap = createBinaryBitmap(imageData, width, height);
    const result = reader.decode(binaryBitmap);

    return {
      type: mapBarcodeFormat(result.getBarcodeFormat()),
      value: result.getText(),
      rawResult: result,
    };
  } catch (error) {
    // No code found or error during decoding
    return null;
  }
}

/**
 * Load an image from a URL or data URL
 * @param src - The image source URL
 * @returns Promise<HTMLImageElement>
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Read QR code from a file (File or Blob)
 * @param file - The file to decode
 * @param options - Optional configuration for decoding
 * @returns Promise<QRCodeResult | null>
 */
export async function readQRCodeFromFile(
  file: File | Blob,
  options: QRCodeReaderOptions = {}
): Promise<QRCodeResult | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const result = await readQRCode(dataUrl, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read multiple QR codes from an image (for images with multiple codes)
 * Note: This uses a simple grid-based approach to find multiple codes
 * @param source - The image source to decode
 * @param options - Optional configuration for decoding
 * @returns Promise<QRCodeResult[]> - Array of decoded results
 */
export async function readMultipleQRCodes(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string,
  options: QRCodeReaderOptions = {}
): Promise<QRCodeResult[]> {
  const results: QRCodeResult[] = [];
  const foundTexts = new Set<string>();

  // First try to read the full image
  const fullResult = await readQRCode(source, options);
  if (fullResult) {
    results.push(fullResult);
    foundTexts.add(fullResult.value);
  }

  // Get image data for grid-based scanning
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width: number;
  let height: number;

  if (typeof source === 'string') {
    const img = await loadImage(source);
    canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    width = img.width;
    height = img.height;
  } else if (source instanceof HTMLImageElement) {
    canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    width = source.width;
    height = source.height;
  } else if (source instanceof HTMLCanvasElement) {
    canvas = source;
    ctx = canvas.getContext('2d')!;
    width = source.width;
    height = source.height;
  } else {
    canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    ctx = canvas.getContext('2d')!;
    ctx.putImageData(source, 0, 0);
    width = source.width;
    height = source.height;
  }

  // Try different regions of the image
  const gridSize = 3; // 3x3 grid
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      const w = Math.min(cellWidth + 50, width - x); // Add some overlap
      const h = Math.min(cellHeight + 50, height - y);

      const regionData = ctx.getImageData(x, y, w, h);
      const regionResult = await readQRCode(regionData, options);

      if (regionResult && !foundTexts.has(regionResult.value)) {
        results.push(regionResult);
        foundTexts.add(regionResult.value);
      }
    }
  }

  return results;
}

/**
 * Check if a QR code is valid/parseable
 * @param source - The image source to check
 * @returns Promise<boolean>
 */
export async function isValidQRCode(
  source: HTMLImageElement | HTMLCanvasElement | ImageData | string
): Promise<boolean> {
  const result = await readQRCode(source);
  return result !== null;
}
