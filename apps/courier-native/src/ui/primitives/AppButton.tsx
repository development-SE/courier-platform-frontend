import { Pressable, StyleSheet, type ViewStyle } from 'react-native'
import { appTheme } from '../../theme/appTheme'
import { AppText } from './AppText'

type AppButtonVariant = 'primary' | 'outline' | 'danger'

type Props = {
  title: string
  onPress: () => void
  variant?: AppButtonVariant
  disabled?: boolean
  style?: ViewStyle
}

export function AppButton({ title, onPress, variant = 'primary', disabled = false, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        styles[variant],
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <AppText variant="button" color={stylesText[variant]}>
        {title}
      </AppText>
    </Pressable>
  )
}

const stylesText = {
  primary: '#fff7f3',
  outline: '#f3f5ff',
  danger: '#ffd9df',
} as const

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: appTheme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
  },
  primary: {
    backgroundColor: appTheme.colors.primary,
  },
  outline: {
    borderWidth: 1,
    borderColor: '#2f3250',
    backgroundColor: '#1a1c2b',
  },
  danger: {
    borderWidth: 1,
    borderColor: '#7e3646',
    backgroundColor: '#3a1f2a',
  },
  disabled: {
    opacity: 0.65,
  },
})
