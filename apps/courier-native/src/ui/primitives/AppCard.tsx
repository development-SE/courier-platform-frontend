import type { PropsWithChildren } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { appTheme } from '../../theme/appTheme'

type Props = PropsWithChildren<{
  style?: ViewStyle
}>

export function AppCard({ children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.card,
    padding: appTheme.spacing.md,
    gap: appTheme.spacing.xs,
  },
})
