import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ParcelOrderAcceptingScreenProps = {
  pickupAddress: string
  deliveryAddress: string
  price: number
  orderNumber: string
  onComplete?: () => void
}

export function ParcelOrderAcceptingScreen({
  pickupAddress,
  deliveryAddress,
  price,
  orderNumber,
  onComplete,
}: ParcelOrderAcceptingScreenProps) {
  const insets = useSafeAreaInsets()

  const outerPulse = useRef(new Animated.Value(0)).current
  const innerPulse = useRef(new Animated.Value(0)).current
  const progressWidth = useRef(new Animated.Value(0)).current
  const screenOpacity = useRef(new Animated.Value(1)).current
  const screenTranslateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const outerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(outerPulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    const innerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(280),
        Animated.timing(innerPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(innerPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    outerLoop.start()
    innerLoop.start()

    const progressAnimation = Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    progressAnimation.start(({ finished }) => {
      if (!finished) return

      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenTranslateY, {
          toValue: -12,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished: fadeFinished }) => {
        if (fadeFinished) {
          onComplete?.()
        }
      })
    })

    return () => {
      outerLoop.stop()
      innerLoop.stop()
      progressAnimation.stop()
    }
  }, [innerPulse, onComplete, outerPulse, progressWidth, screenOpacity, screenTranslateY])

  const outerScale = outerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.08] })
  const outerOpacity = outerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.18] })

  const innerScale = innerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] })
  const innerOpacity = innerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.72, 0.28] })

  const progressInterpolated = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Animated.View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          opacity: screenOpacity,
          transform: [{ translateY: screenTranslateY }],
        },
      ]}
    >
      <View style={styles.center}>
        <View style={styles.iconFrame}>
          <Animated.View
            style={[styles.outerRing, { transform: [{ scale: outerScale }], opacity: outerOpacity }]}
          />
          <Animated.View
            style={[styles.innerRing, { transform: [{ scale: innerScale }], opacity: innerOpacity }]}
          />
          <View style={styles.iconCore}>
            <MaterialCommunityIcons name="package-variant-closed" size={36} color="#ffffff" />
          </View>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressInterpolated }]} />
        </View>

        <View style={styles.textBlock}>
          <Text allowFontScaling={false} style={styles.heading}>
            Placing your order...
          </Text>
          <Text allowFontScaling={false} style={styles.subtitle}>
            Finding a courier for your parcel
          </Text>
        </View>
      </View>

      <View style={styles.orderCard}>
        <View style={styles.routeWrap}>
          <View style={styles.routeRow}>
            <View style={styles.fromDot} />
            <Text allowFontScaling={false} style={styles.routeAddress} numberOfLines={1}>
              {pickupAddress || 'Pickup address'}
            </Text>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routeRow}>
            <View style={styles.toDot} />
            <Text allowFontScaling={false} style={styles.routeAddress} numberOfLines={1}>
              {deliveryAddress || 'Delivery address'}
            </Text>
          </View>
        </View>

        <View style={styles.orderRight}>
          <Text allowFontScaling={false} style={styles.orderNumber}>
            #{orderNumber}
          </Text>
          <Text allowFontScaling={false} style={styles.total}>
            ₸{price.toLocaleString()}
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  iconFrame: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ff7a59',
  },
  innerRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#ff7a59',
  },
  iconCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a7391e',
    shadowColor: '#a7391e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
    zIndex: 1,
  },
  progressTrack: {
    width: 192,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e6e8ea',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#a7391e',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  heading: {
    color: '#191c1e',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
  },
  orderCard: {
    width: '100%',
    padding: 20,
    marginBottom: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    gap: 12,
  },
  routeWrap: {
    flex: 1,
    gap: 0,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 26,
  },
  fromDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff7a59',
    flexShrink: 0,
  },
  routeConnector: {
    width: 2,
    height: 10,
    backgroundColor: '#e5e7eb',
    marginLeft: 4,
  },
  toDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#191c1e',
    flexShrink: 0,
  },
  routeAddress: {
    color: '#191c1e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  orderNumber: {
    color: '#58423c',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    fontWeight: '600',
  },
  total: {
    color: '#a7391e',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
})
