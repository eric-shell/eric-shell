export async function renderHTMLToCanvas(
  ctx: CanvasRenderingContext2D,
  html: string,
  width: number,
  height: number
): Promise<void> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml"
           style="width:${width}px;height:${height}px;overflow:hidden">
        ${html}
      </div>
    </foreignObject>
  </svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.src = url
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('htmlToCanvas: failed to load SVG'))
  })

  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)
}
