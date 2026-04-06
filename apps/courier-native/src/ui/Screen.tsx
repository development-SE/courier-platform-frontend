import type { PropsWithChildren } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { appTheme } from '../theme/appTheme'
import { AppText } from './primitives'

type ScreenProps = PropsWithChildren<{
  title: string
  subtitle?: string
}>

export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="subtitle" style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  header: {
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: appTheme.spacing.sm,
    paddingBottom: appTheme.spacing.xs,
  },
  subtitle: {
    marginTop: appTheme.spacing.xxs,
  },
  content: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.sm,
  },
})
