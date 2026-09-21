import AppKit
import Foundation

let projectRoot = CommandLine.arguments.count > 1
  ? URL(fileURLWithPath: CommandLine.arguments[1])
  : URL(fileURLWithPath: FileManager.default.currentDirectoryPath)

let blue = NSColor(srgbRed: 26 / 255, green: 115 / 255, blue: 232 / 255, alpha: 1)
let paleBlue = NSColor(srgbRed: 210 / 255, green: 227 / 255, blue: 252 / 255, alpha: 1)
let navy = NSColor(srgbRed: 23 / 255, green: 35 / 255, blue: 60 / 255, alpha: 1)

func savePNG(_ image: NSImage, to relativePath: String) throws {
  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(image.size.width),
    pixelsHigh: Int(image.size.height),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ), let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    throw NSError(domain: "docode.assets", code: 1)
  }
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  image.draw(in: NSRect(origin: .zero, size: image.size),
             from: NSRect(origin: .zero, size: image.size), operation: .copy, fraction: 1)
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()

  guard let png = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "docode.assets", code: 2)
  }
  try png.write(to: projectRoot.appendingPathComponent(relativePath))
}

func stroke(_ points: [NSPoint], color: NSColor, width: CGFloat) {
  let path = NSBezierPath()
  path.lineWidth = width
  path.lineCapStyle = .round
  path.lineJoinStyle = .round
  path.move(to: points[0])
  for point in points.dropFirst() { path.line(to: point) }
  color.setStroke()
  path.stroke()
}

func drawMark(in rect: NSRect) {
  let scale = rect.width / 128
  func point(_ x: CGFloat, _ y: CGFloat) -> NSPoint {
    NSPoint(x: rect.minX + x * scale, y: rect.minY + y * scale)
  }
  stroke([point(49, 90), point(27, 64), point(49, 38)], color: .white, width: 11 * scale)
  stroke([point(79, 90), point(101, 64), point(79, 38)], color: .white, width: 11 * scale)
  stroke([point(72, 97), point(56, 31)], color: paleBlue, width: 10 * scale)
}

func icon(size: Int) -> NSImage {
  let dimension = CGFloat(size)
  let image = NSImage(size: NSSize(width: dimension, height: dimension))
  image.lockFocus()
  NSGraphicsContext.current?.imageInterpolation = .high
  blue.setFill()
  NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: dimension, height: dimension),
               xRadius: dimension * 28 / 128, yRadius: dimension * 28 / 128).fill()
  drawMark(in: NSRect(x: 0, y: 0, width: dimension, height: dimension))
  image.unlockFocus()
  return image
}

func text(_ value: String, at point: NSPoint, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
  let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: color
  ]
  (value as NSString).draw(at: point, withAttributes: attributes)
}

func promotionalTile() -> NSImage {
  let image = NSImage(size: NSSize(width: 440, height: 280))
  image.lockFocus()
  navy.setFill()
  NSRect(x: 0, y: 0, width: 440, height: 280).fill()

  blue.withAlphaComponent(0.18).setFill()
  NSBezierPath(ovalIn: NSRect(x: 277, y: 132, width: 232, height: 232)).fill()
  paleBlue.withAlphaComponent(0.08).setFill()
  NSBezierPath(ovalIn: NSRect(x: -96, y: -132, width: 264, height: 264)).fill()

  blue.setFill()
  NSBezierPath(roundedRect: NSRect(x: 42, y: 160, width: 72, height: 72), xRadius: 17, yRadius: 17).fill()
  drawMark(in: NSRect(x: 42, y: 160, width: 72, height: 72))

  text("docode", at: NSPoint(x: 42, y: 105), size: 44, weight: .bold, color: .white)
  text("Developer mode for Google Docs", at: NSPoint(x: 42, y: 76), size: 18, weight: .regular, color: paleBlue)

  NSColor.white.withAlphaComponent(0.1).setFill()
  NSBezierPath(roundedRect: NSRect(x: 42, y: 22, width: 217, height: 32), xRadius: 16, yRadius: 16).fill()
  text("Write · highlight · keep in Docs", at: NSPoint(x: 57, y: 30), size: 13, weight: .semibold, color: .white)

  image.unlockFocus()
  return image
}

for size in [16, 32, 48, 128] {
  try savePNG(icon(size: size), to: "icons/icon-\(size).png")
}
try savePNG(promotionalTile(), to: "store/assets/small-promo-440x280.png")
