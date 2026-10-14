import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
} from 'three'

export type CarbonFiberTextureSet = {
  normalMap: CanvasTexture
  roughnessMap: CanvasTexture
}

const TEXTURE_SIZE = 512
const WEAVE_FREQUENCY = 12
const DEFAULT_REPEAT = 22
const DEFAULT_ANISOTROPY = 8

let cachedTextureSet: CarbonFiberTextureSet | null = null

function fract(value: number): number {
  return value - Math.floor(value)
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(
  edge0: number,
  edge1: number,
  value: number,
): number {
  const range = edge1 - edge0

  if (Math.abs(range) < Number.EPSILON) {
    return value < edge0 ? 0 : 1
  }

  const normalized = clamp01((value - edge0) / range)

  return normalized * normalized * (3 - 2 * normalized)
}

function wrappedModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function createStripe(
  coordinate: number,
  innerWidth = 0.17,
  outerWidth = 0.34,
): number {
  const distanceFromCenter = Math.abs(fract(coordinate) - 0.5)

  return 1 - smoothstep(
    innerWidth,
    outerWidth,
    distanceFromCenter,
  )
}

function createCarbonHeightField(size: number): Float32Array {
  const heights = new Float32Array(size * size)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size
      const v = y / size

      // Hai nhóm sợi chạy chéo ngược hướng nhau.
      const forwardCoordinate =
        (u + v) * WEAVE_FREQUENCY

      const backwardCoordinate =
        (u - v) * WEAVE_FREQUENCY

      const forwardStripe = createStripe(forwardCoordinate)
      const backwardStripe = createStripe(backwardCoordinate)

      const forwardIndex = Math.floor(forwardCoordinate)
      const backwardIndex = Math.floor(backwardCoordinate)

      // Mô phỏng cấu trúc 2x2 twill:
      // hai sợi nổi, sau đó hai sợi chìm.
      const twillPhase = wrappedModulo(
        forwardIndex - backwardIndex,
        4,
      )

      const forwardIsAbove = twillPhase < 2

      const upperStrand = forwardIsAbove
        ? forwardStripe
        : backwardStripe

      const lowerStrand = forwardIsAbove
        ? backwardStripe
        : forwardStripe

      const strandBody = Math.max(
        upperStrand,
        lowerStrand * 0.42,
      )

      const crossoverLift =
        upperStrand * lowerStrand * 0.16

      heights[y * size + x] = clamp01(
        strandBody * 0.84 + crossoverLift,
      )
    }
  }

  return heights
}

function createNormalCanvas(
  heights: Float32Array,
  size: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Unable to create the carbon-fiber normal-map canvas.',
    )
  }

  const imageData = context.createImageData(size, size)
  const pixels = imageData.data

  const normalStrength = 4.2

  const getHeight = (x: number, y: number): number => {
    const wrappedX = wrappedModulo(x, size)
    const wrappedY = wrappedModulo(y, size)

    return heights[wrappedY * size + wrappedX]
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const left = getHeight(x - 1, y)
      const right = getHeight(x + 1, y)
      const up = getHeight(x, y - 1)
      const down = getHeight(x, y + 1)

      let normalX = -(right - left) * normalStrength
      let normalY = -(down - up) * normalStrength
      let normalZ = 1

      const length = Math.hypot(
        normalX,
        normalY,
        normalZ,
      )

      normalX /= length
      normalY /= length
      normalZ /= length

      const pixelIndex = (y * size + x) * 4

      pixels[pixelIndex] = Math.round(
        (normalX * 0.5 + 0.5) * 255,
      )

      pixels[pixelIndex + 1] = Math.round(
        (normalY * 0.5 + 0.5) * 255,
      )

      pixels[pixelIndex + 2] = Math.round(
        (normalZ * 0.5 + 0.5) * 255,
      )

      pixels[pixelIndex + 3] = 255
    }
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

function createRoughnessCanvas(
  heights: Float32Array,
  size: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Unable to create the carbon-fiber roughness-map canvas.',
    )
  }

  const imageData = context.createImageData(size, size)
  const pixels = imageData.data

  for (let index = 0; index < heights.length; index += 1) {
    const strandHeight = heights[index]

    // Gần 1.0 để Roughness slider hiện tại vẫn là giá trị chính.
    // Sợi nổi bóng hơn sợi chìm một lượng nhỏ.
    const roughnessValue =
      0.98 - strandHeight * 0.12

    const encodedValue = Math.round(
      clamp01(roughnessValue) * 255,
    )

    const pixelIndex = index * 4

    pixels[pixelIndex] = encodedValue
    pixels[pixelIndex + 1] = encodedValue
    pixels[pixelIndex + 2] = encodedValue
    pixels[pixelIndex + 3] = 255
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}

function configureCarbonTexture(
  texture: CanvasTexture,
): CanvasTexture {
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  texture.repeat.set(
    DEFAULT_REPEAT,
    DEFAULT_REPEAT,
  )

  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = DEFAULT_ANISOTROPY

  // Normal và roughness là dữ liệu, không phải màu sRGB.
  texture.colorSpace = NoColorSpace

  // Phù hợp với UV của model GLB/glTF.
  texture.flipY = false
  texture.needsUpdate = true

  return texture
}

export function getCarbonFiberTextures():
CarbonFiberTextureSet {
  if (cachedTextureSet) {
    return cachedTextureSet
  }

  const heightField =
    createCarbonHeightField(TEXTURE_SIZE)

  const normalCanvas = createNormalCanvas(
    heightField,
    TEXTURE_SIZE,
  )

  const roughnessCanvas = createRoughnessCanvas(
    heightField,
    TEXTURE_SIZE,
  )

  cachedTextureSet = {
    normalMap: configureCarbonTexture(
      new CanvasTexture(normalCanvas),
    ),

    roughnessMap: configureCarbonTexture(
      new CanvasTexture(roughnessCanvas),
    ),
  }

  return cachedTextureSet
}

export function disposeCarbonFiberTextures(): void {
  cachedTextureSet?.normalMap.dispose()
  cachedTextureSet?.roughnessMap.dispose()
  cachedTextureSet = null
}