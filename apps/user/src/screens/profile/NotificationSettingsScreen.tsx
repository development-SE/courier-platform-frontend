import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export type NotificationSettingsState = {
  courierMessages: boolean
  masterEnabled: boolean
  orderUpdates: boolean
  parcelUpdates: boolean
  promotions: boolean
}

type NotificationSettingsScreenProps = {
  onBackPress: () => void
  onReset: () => void
  onUpdate: (next: NotificationSettingsState) => void
  safeBottom: number
  settings: NotificationSettingsState
}

export function NotificationSettingsScreen({
  onBackPress,
  onReset,
  onUpdate,
  safeBottom,
  settings,
}: NotificationSettingsScreenProps) {
  const toggle = (key: keyof NotificationSettingsState) => {
    onUpdate({
      ...settings,
      [key]: !settings[key],
    })
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Notifications
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(40, safeBottom + 24) },
        ]}
      >
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconWrap}>
              <Feather name="bell" size={18} color="#a7391e" />
            </View>

            <View style={styles.masterCopy}>
              <Text allowFontScaling={false} style={styles.masterTitle}>
                Enable{'\n'}Notifications
              </Text>
              <Text allowFontScaling={false} style={styles.masterSubtitle}>
                Master switch for all alerts
              </Text>
            </View>
          </View>

          <ToggleSwitch
            checked={settings.masterEnabled}
            onPress={() => toggle('masterEnabled')}
          />
        </View>

        <View style={styles.groupCard}>
          <NotificationRow
            checked={settings.orderUpdates}
            icon="truck"
            label="Order updates"
            onPress={() => toggle('orderUpdates')}
            subtitle="Status changes and delays"
          />
          <NotificationRow
            checked={settings.promotions}
            icon="tag"
            label="Promotions & offers"
            onPress={() => toggle('promotions')}
            subtitle={'Discounts and special\nevents'}
          />
          <NotificationRow
            checked={settings.courierMessages}
            icon="message-square"
            label="Courier messages"
            onPress={() => toggle('courierMessages')}
            subtitle="Direct chat from driver"
          />
          <NotificationRow
            checked={settings.parcelUpdates}
            icon="archive"
            isLast
            label="Parcel updates"
            onPress={() => toggle('parcelUpdates')}
            subtitle="Pickup and drop-off points"
          />
        </View>

        <View style={styles.resetWrap}>
          <Pressable style={styles.resetButton} onPress={onReset}>
            <Text allowFontScaling={false} style={styles.resetText}>
              Reset to Default
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type NotificationRowProps = {
  checked: boolean
  icon: keyof typeof Feather.glyphMap
  isLast?: boolean
  label: string
  onPress: () => void
  subtitle: string
}

function NotificationRow({
  checked,
  icon,
  isLast,
  label,
  onPress,
  subtitle,
}: NotificationRowProps) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconWrap}>
          <Feather name={icon} size={18} color="#58423c" />
        </View>

        <View style={styles.rowCopy}>
          <Text allowFontScaling={false} style={styles.rowLabel}>
            {label}
          </Text>
          <Text allowFontScaling={false} style={styles.rowSubtitle}>
            {subtitle}
          </Text>
        </View>
      </View>

      <ToggleSwitch checked={checked} onPress={onPress} />
    </View>
  )
}

type ToggleSwitchProps = {
  checked: boolean
  onPress: () => void
}

function ToggleSwitch({ checked, onPress }: ToggleSwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={[styles.switchTrack, checked && styles.switchTrackActive]}
    >
      <View style={[styles.switchThumb, checked && styles.switchThumbActive]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: '#f7f9fb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#191c1e',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 24,
  },
  masterCard: {
    padding: 24,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#191c1e',
    shadowOpacity: 0.03,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  masterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 12,
  },
  masterIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 122, 89, 0.10)',
  },
  masterCopy: {
    flex: 1,
  },
  masterTitle: {
    color: '#191c1e',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  masterSubtitle: {
    marginTop: 4,
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  groupCard: {
    padding: 8,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOpacity: 0.03,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    padding: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLast: {
    marginBottom: 0,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 12,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eceef0',
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  rowSubtitle: {
    marginTop: 2,
    color: '#58423c',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  switchTrack: {
    width: 48,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: '#e6e8ea',
  },
  switchTrackActive: {
    backgroundColor: '#a7391e',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e6e8ea',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    borderColor: '#a7391e',
  },
  resetWrap: {
    paddingTop: 8,
    alignItems: 'center',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 48,
    backgroundColor: '#f2f4f6',
  },
  resetText: {
    color: '#58423c',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
})
