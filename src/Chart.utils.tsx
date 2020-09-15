import { ChartDomain, Padding, ViewPort } from './types'

export const calculateDataDimensions = (dimensions: { width: number; height: number } | undefined, padding: Required<Padding>) => {
  if (dimensions) {
    return {
      top: 0,
      left: 0,
      width: dimensions.width - padding.left - padding.right,
      height: dimensions.height - padding.top - padding.bottom,
    }
  }

  return undefined
}

export const calculateViewportDimensions = (viewport: ViewPort, domain: ChartDomain, panX: number, panY: number) => {
  const minX = Math.max(panX + viewport.initialOrigin.x, domain.x.min)
  const maxX = Math.min(minX + viewport.size.width, domain.x.max)

  const minY = Math.max(panY + viewport.initialOrigin.y, domain.y.min)
  const maxY = Math.min(minY + viewport.size.width, domain.y.max)

  return {
    x: { min: minX, max: maxX },
    y: { min: minY, max: maxY },
  }
}
