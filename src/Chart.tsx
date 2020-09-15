import * as React from 'react'
import deepmerge from 'deepmerge'
import { Animated, View, ViewStyle } from 'react-native'
import { PanGestureHandler, State } from 'react-native-gesture-handler'
import clamp from 'lodash.clamp'
import minBy from 'lodash.minby'
import maxBy from 'lodash.maxby'
import Svg, { G } from 'react-native-svg'
import { useComponentDimensions } from './useComponentDimensions'
import { AxisDomain, ChartDataPoint, Padding, XYValue, ViewPort } from './types'
import { ChartContextProvider } from './ChartContext'
import { calculateDataDimensions, calculateViewportDimensions } from './Chart.utils'

type Props = {
  /** All styling can be used except for padding. If you need padding, use the explicit `padding` prop below.*/
  style?: ViewStyle
  /** Data to be used by `<Area />` or `<Line />` children. Not required, and can be overridden in Area or Line components. */
  data?: ChartDataPoint[]
  /** Domain for the horizontal (X) axis. */
  xDomain?: AxisDomain
  /** Domain for the vertical (Y) axis. */
  yDomain?: AxisDomain
  viewport?: ViewPort
  /** Padding of the chart. Use this instead of setting padding in the `style` prop. */
  padding?: Padding
}

const Chart: React.FC<Props> = (props) => {
  const { style, children, data = [], padding, xDomain, yDomain, viewport } = deepmerge(computeDefaultProps(props), props)
  const { dimensions, onLayout } = useComponentDimensions()
  const dataDimensions = calculateDataDimensions(dimensions, padding)

  const [lastTouch, setLastTouch] = React.useState<XYValue | undefined>(undefined)
  const [panX, setPanX] = React.useState<number>(0)
  const [panY, setPanY] = React.useState<number>(0)
  const [offset] = React.useState(new Animated.ValueXY({ x: 0, y: 0 }))
  const [drag] = React.useState(new Animated.ValueXY())

  const viewportDomain = calculateViewportDimensions(
    viewport,
    {
      x: xDomain,
      y: yDomain,
    },
    panX,
    panY
  )

  const handleTouchEvent = (evt) => {
    if (dataDimensions) {
      setLastTouch({
        x: clamp(evt.nativeEvent.x - padding.left, 0, dataDimensions.width),
        y: clamp(evt.nativeEvent.y - padding.top, 0, dataDimensions.height),
      })

      const factorX = Math.abs(viewportDomain.x.max - viewportDomain.x.min) / dataDimensions.width
      setPanX(offset.x._value - evt.nativeEvent.translationX * factorX)

      const factorY = Math.abs(viewportDomain.y.max - viewportDomain.y.min) / dataDimensions.height
      setPanY(offset.y._value + evt.nativeEvent.translationY * factorY)

      if (evt.nativeEvent.state === State.END) {
        offset.x.setValue(offset.x._value - evt.nativeEvent.translationX * factorX)
        offset.y.setValue(offset.y._value + evt.nativeEvent.translationY * factorY)
      }
    }
    return true
  }

  const _onPanGestureEvent = Animated.event([{ nativeEvent: { translationX: drag.x, translationY: drag.y } }], {
    useNativeDriver: true,
    listener: handleTouchEvent,
  })

  return (
    <View style={style} onLayout={onLayout}>
      {!!dimensions && (
        <PanGestureHandler onGestureEvent={_onPanGestureEvent} onHandlerStateChange={_onPanGestureEvent}>
          <Animated.View style={{ width: dimensions.width, height: dimensions.height }}>
            <ChartContextProvider
              value={{
                data,
                dimensions: dataDimensions,
                domain: {
                  x: xDomain,
                  y: yDomain,
                },
                viewportDomain,
                lastTouch,
              }}
            >
              <Svg width={dimensions.width} height={dimensions.height}>
                <G translateX={padding.left} translateY={padding.top}>
                  {children}
                </G>
              </Svg>
            </ChartContextProvider>
          </Animated.View>
        </PanGestureHandler>
      )}
    </View>
  )
}

export { Chart }

const computeDefaultProps = (props: Props) => {
  const { data = [], viewport } = props

  const xDomain = props.xDomain ?? {
    min: data.length > 0 ? minBy(data, (d) => d.x)!.x : 0,
    max: data.length > 0 ? maxBy(data, (d) => d.x)!.x : 10,
  }

  const yDomain = props.yDomain ?? {
    min: data.length > 0 ? minBy(data, (d) => d.y)!.y : 0,
    max: data.length > 0 ? maxBy(data, (d) => d.y)!.y : 10,
  }

  return {
    padding: {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
    },
    xDomain,
    yDomain,
    viewport: {
      size: { width: Math.abs(xDomain.max - xDomain.min), height: Math.abs(yDomain.max - yDomain.min) },
      initialOrigin: { x: xDomain.min, y: yDomain.min },
    },
  }
}
