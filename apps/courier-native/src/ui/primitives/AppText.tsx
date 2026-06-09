import type { PropsWithChildren } from 'react'
import { Text, StyleSheet, type TextStyle, type StyleProp } from 'react-native'
import { appTheme } from '../../theme/appTheme'

type AppTextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'button'

type Props = PropsWithChildren<{
  variant?: AppTextVariant
  color?: string
  style?: StyleProp<TextStyle>
}>

export function AppText({ children, variant = 'body', color, style }: Props) {
  return (
    <Text style={[styles.base, styles[variant], color ? { color } : null, style]}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    color: appTheme.colors.text,
  },
  title: {
    fontSize: appTheme.typography.title.fontSize,
    fontWeight: appTheme.typography.title.fontWeight,
  },
  subtitle: {
    fontSize: appTheme.typography.subtitle.fontSize,
    fontWeight: appTheme.typography.subtitle.fontWeight,
    color: appTheme.colors.textMuted,
  },
  body: {
    fontSize: appTheme.typography.body.fontSize,
    fontWeight: appTheme.typography.body.fontWeight,
  },
  label: {
    fontSize: appTheme.typography.label.fontSize,
    fontWeight: appTheme.typography.label.fontWeight,
  },
  button: {
    fontSize: appTheme.typography.button.fontSize,
    fontWeight: appTheme.typography.button.fontWeight,
  },
})
