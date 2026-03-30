import { prepareWithSegments, layoutWithLines } from "@chenglou/pretext";

const IMAGE_WIDTH = 1728;
const IMAGE_HEIGHT = 2160;
const TEXT_X = 920;
const TEXT_Y = 1500;
const LABEL_WIDTH = 480;
const LABEL_HEIGHT = 225;
const MAX_FONT_SIZE = 43;
const MIN_FONT_SIZE = 12;

function fontString(size: number): string {
  return `bold ${size}px helvetica`;
}

/**
 * Binary-search the largest font size where the text fits within LABEL_HEIGHT.
 * Uses pretext layoutWithLines() for accurate measurement.
 */
function fitText(
  text: string
): { lines: { text: string }[]; fontSize: number; lineHeight: number } {
  let lo = MIN_FONT_SIZE;
  let hi = MAX_FONT_SIZE;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const lineHeight = mid * 1.35;
    const prepared = prepareWithSegments(text, fontString(mid));
    const { height } = layoutWithLines(prepared, LABEL_WIDTH, lineHeight);
    if (height <= LABEL_HEIGHT) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  const fontSize = lo;
  const lineHeight = fontSize * 1.35;
  const prepared = prepareWithSegments(text, fontString(fontSize));
  const { lines } = layoutWithLines(prepared, LABEL_WIDTH, lineHeight);
  return { lines, fontSize, lineHeight };
}

export async function putLabel(imageURL: string, label: string): Promise<string> {
  const image = new Image();
  image.src = imageURL;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const { lines, fontSize, lineHeight } = fitText(label);
  const totalHeight = lines.length * lineHeight;
  const deltaY = 95 - totalHeight / 2;

  ctx.setTransform(1.2, -0.215, -0.02, 1.5, TEXT_X, TEXT_Y + deltaY);
  ctx.font = fontString(fontSize);

  let y = 0;
  for (const line of lines) {
    ctx.fillText(line.text, 0, y);
    y += lineHeight;
  }

  return canvas.toDataURL();
}
