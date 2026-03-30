export async function putLabel(imageURL: string, label: string): Promise<string> {
  const image = new Image();
  image.src = imageURL;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  const IMAGE_WIDTH = 1728;
  const IMAGE_HEIGHT = 2160;
  const TEXT_X = 920;
  const TEXT_Y = 1500;
  const labelWidth = 480;
  const labelHeight = 225;

  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const formatText = (text: string, fontSize: number): string[] => {
    ctx.font = `bold ${fontSize}px helvetica`;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = cur + " " + words[i];
      if (ctx.measureText(candidate).width < labelWidth) {
        cur = candidate;
      } else {
        lines.push(cur);
        cur = words[i];
      }
    }
    lines.push(cur);
    return lines;
  };

  let lines: string[] = [];
  let textHeight = labelHeight + 1;
  let fontSize = 43;

  while (textHeight > labelHeight) {
    fontSize -= 1;
    lines = formatText(label, fontSize);
    textHeight = 0;
    for (const line of lines) {
      const m = ctx.measureText(line);
      textHeight += m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    }
    const deltaY = 95 - textHeight / 2;
    ctx.setTransform(1.2, -0.215, -0.02, 1.5, TEXT_X, TEXT_Y + deltaY);
  }

  let y = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    const lineH = (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 2.2;
    ctx.fillText(line, 0, y);
    y += lineH;
    ctx.translate(0, lineH);
  }

  return canvas.toDataURL();
}
