import { StyleSheet, View } from 'react-native'
import { tryRequireModule } from '../../../platform/native/optionalDependencies'

export function NativeBottomSheet({ children, snapPoints = ['46%'] }) {
  const bottomSheetModule = tryRequireModule('@gorhom/bottom-sheet')

  if (!bottomSheetModule?.default) {
    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.fallbackSheet}>{children}</View>
      </View>
    )
  }

  const BottomSheet = bottomSheetModule.default
  const BottomSheetView = bottomSheetModule.BottomSheetView ?? View

  return (
    <View style={styles.sheetContainer}>
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={styles.sheetContent}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  fallbackContainer: {
    width: '100%',
  },
  fallbackSheet: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#25263a',
    backgroundColor: '#141621',
    padding: 12,
    gap: 8,
  },
  sheetContainer: {
    width: '100%',
    minHeight: 260,
  },
  sheetHandle: {
    backgroundColor: '#484d6b',
    width: 44,
  },
  sheetBackground: {
    backgroundColor: '#141621',
    borderWidth: 1,
    borderColor: '#25263a',
  },
  sheetContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
})
