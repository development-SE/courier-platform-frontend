import { Feather } from '@expo/vector-icons'
import { useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { UserAddressScreen } from '../address/UserAddressScreen'
import {
  AboutAppScreen,
} from './AboutAppScreen'
import { DeleteAccountScreen } from './DeleteAccountScreen'
import {
  NotificationSettingsScreen,
  type NotificationSettingsState,
} from './NotificationSettingsScreen'
import { PaymentMethodsScreen } from './PaymentMethodsScreen'
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen'
import { TermsConditionsScreen } from './TermsConditionsScreen'
import { LanguageScreen, type LanguageCode } from './LanguageScreen'
import { setDeviceEnabled } from '../../data/notificationsApi'

type SettingsScreenProps = {
  onBackPress: () => void
  safeBottom: number
  accessToken?: string
}

type SettingsRowProps = {
  icon: keyof typeof Feather.glyphMap
  label: string
  onPress?: () => void
  value?: string
}

export function SettingsScreen({
  onBackPress,
  safeBottom,
  accessToken,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const addressProgress = useRef(new Animated.Value(0)).current
  const aboutProgress = useRef(new Animated.Value(0)).current
  const deleteAccountProgress = useRef(new Animated.Value(0)).current
  const languageProgress = useRef(new Animated.Value(0)).current
  const notificationsProgress = useRef(new Animated.Value(0)).current
  const paymentMethodsProgress = useRef(new Animated.Value(0)).current
  const privacyProgress = useRef(new Animated.Value(0)).current
  const termsProgress = useRef(new Animated.Value(0)).current
  const [isAddressOpen, setIsAddressOpen] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('english')
  const defaultNotificationSettings: NotificationSettingsState = {
    masterEnabled: false,
    orderUpdates: false,
    promotions: true,
    courierMessages: true,
    parcelUpdates: true,
  }
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>(
    defaultNotificationSettings,
  )

  const languageLabelMap: Record<LanguageCode, string> = {
    english: 'English',
    russian: 'Russian',
    kazakh: 'Kazakh',
    spanish: 'Spanish',
  }

  const openLanguage = () => {
    setIsLanguageOpen(true)
    languageProgress.setValue(0)
    Animated.timing(languageProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeLanguage = () => {
    Animated.timing(languageProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsLanguageOpen(false)
      }
    })
  }

  const openNotifications = () => {
    setIsNotificationsOpen(true)
    notificationsProgress.setValue(0)
    Animated.timing(notificationsProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeNotifications = () => {
    Animated.timing(notificationsProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsNotificationsOpen(false)
      }
    })
  }

  const openAddress = () => {
    setIsAddressOpen(true)
    addressProgress.setValue(0)
    Animated.timing(addressProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeAddress = () => {
    Animated.timing(addressProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsAddressOpen(false)
      }
    })
  }

  const openPaymentMethods = () => {
    setIsPaymentMethodsOpen(true)
    paymentMethodsProgress.setValue(0)
    Animated.timing(paymentMethodsProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closePaymentMethods = () => {
    Animated.timing(paymentMethodsProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPaymentMethodsOpen(false)
      }
    })
  }

  const openAbout = () => {
    setIsAboutOpen(true)
    aboutProgress.setValue(0)
    Animated.timing(aboutProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeAbout = () => {
    Animated.timing(aboutProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsAboutOpen(false)
      }
    })
  }

  const openDeleteAccount = () => {
    setIsDeleteAccountOpen(true)
    deleteAccountProgress.setValue(0)
    Animated.timing(deleteAccountProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeDeleteAccount = () => {
    Animated.timing(deleteAccountProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDeleteAccountOpen(false)
      }
    })
  }

  const openTerms = () => {
    setIsTermsOpen(true)
    termsProgress.setValue(0)
    Animated.timing(termsProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeTerms = () => {
    Animated.timing(termsProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsTermsOpen(false)
      }
    })
  }

  const openPrivacy = () => {
    setIsPrivacyOpen(true)
    privacyProgress.setValue(0)
    Animated.timing(privacyProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closePrivacy = () => {
    Animated.timing(privacyProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPrivacyOpen(false)
      }
    })
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.headerTitle}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(32, safeBottom + 24) },
        ]}
      >
        <View style={styles.heroCard}>
          <View style={[styles.heroGlow, styles.heroGlowPrimary]} />
          <View style={[styles.heroGlow, styles.heroGlowSecondary]} />
          <View style={styles.heroIconWrap}>
            <Feather name="sliders" size={22} color="#a7391e" />
          </View>
        </View>

        <View style={styles.panel}>
          <SettingsSection title="PREFERENCES">
            <SettingsRow
              icon="globe"
              label="Language"
              onPress={openLanguage}
              value={languageLabelMap[selectedLanguage]}
            />
            <SettingsRow icon="bell" label="Notifications" onPress={openNotifications} />
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Feather name="moon" size={18} color="#8b716b" />
                <Text allowFontScaling={false} style={styles.rowLabel}>
                  Dark Mode
                </Text>
              </View>

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: darkMode }}
                onPress={() => setDarkMode((current) => !current)}
                style={[styles.switchTrack, darkMode && styles.switchTrackActive]}
              >
                <View style={[styles.switchThumb, darkMode && styles.switchThumbActive]} />
              </Pressable>
            </View>
          </SettingsSection>

          <SettingsSection title="DELIVERY SETTINGS">
            <SettingsRow
              icon="map-pin"
              label="Default Address"
              onPress={openAddress}
              value="123 Horizon Blvd, Apt 4B"
            />
            <SettingsRow icon="file-text" label="Delivery Instructions" />
          </SettingsSection>

          <SettingsSection title="PAYMENT & SECURITY">
            <SettingsRow
              icon="credit-card"
              label="Payment Methods"
              onPress={openPaymentMethods}
            />
          </SettingsSection>

          <SettingsSection title="APP SETTINGS" isLastSection>
            <SettingsRow icon="info" label="About App" onPress={openAbout} />
            <SettingsRow icon="file-text" label="Terms & Conditions" onPress={openTerms} />
            <SettingsRow icon="shield" label="Privacy Policy" onPress={openPrivacy} />
          </SettingsSection>

          <Pressable style={styles.deleteButton} onPress={openDeleteAccount}>
            <Text allowFontScaling={false} style={styles.deleteText}>
              Delete account
            </Text>
          </Pressable>
        </View>

        <View style={styles.versionWrap}>
          <Text allowFontScaling={false} style={styles.versionText}>
            v2.4.0
          </Text>
        </View>
      </ScrollView>

      {isLanguageOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: languageProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <LanguageScreen
            safeBottom={safeBottom}
            selectedLanguage={selectedLanguage}
            onBackPress={closeLanguage}
            onSelectLanguage={(language) => {
              setSelectedLanguage(language)
              closeLanguage()
            }}
          />
        </Animated.View>
      )}

      {isNotificationsOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: notificationsProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <NotificationSettingsScreen
            safeBottom={safeBottom}
            settings={notificationSettings}
            onBackPress={closeNotifications}
            onReset={() => {
              if (accessToken && notificationSettings.masterEnabled !== defaultNotificationSettings.masterEnabled) {
                setDeviceEnabled(accessToken, defaultNotificationSettings.masterEnabled).catch(() => {})
              }
              setNotificationSettings(defaultNotificationSettings)
            }}
            onUpdate={(next) => {
              if (accessToken && next.masterEnabled !== notificationSettings.masterEnabled) {
                setDeviceEnabled(accessToken, next.masterEnabled).catch(() => {})
              }
              setNotificationSettings(next)
            }}
          />
        </Animated.View>
      )}

      {isAboutOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: aboutProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AboutAppScreen safeBottom={safeBottom} onBackPress={closeAbout} />
        </Animated.View>
      )}

      {isDeleteAccountOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: deleteAccountProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <DeleteAccountScreen safeBottom={safeBottom} onBackPress={closeDeleteAccount} />
        </Animated.View>
      )}

      {isTermsOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: termsProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TermsConditionsScreen safeBottom={safeBottom} onBackPress={closeTerms} />
        </Animated.View>
      )}

      {isPrivacyOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: privacyProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <PrivacyPolicyScreen safeBottom={safeBottom} onBackPress={closePrivacy} />
        </Animated.View>
      )}

      {isAddressOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: addressProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <UserAddressScreen onBackPress={closeAddress} onConfirmPress={closeAddress} accessToken={accessToken || ''} />
        </Animated.View>
      )}

      {isPaymentMethodsOpen && (
        <Animated.View
          style={[
            styles.overlay,
            {
              transform: [
                {
                  translateX: paymentMethodsProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <PaymentMethodsScreen
            safeTop={insets.top}
            safeBottom={safeBottom}
            onBackPress={closePaymentMethods}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

type SettingsSectionProps = {
  children: React.ReactNode
  isLastSection?: boolean
  title: string
}

function SettingsSection({ children, isLastSection, title }: SettingsSectionProps) {
  return (
    <View style={[styles.section, isLastSection && styles.sectionLast]}>
      <Text allowFontScaling={false} style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  )
}

function SettingsRow({ icon, label, onPress, value }: SettingsRowProps) {
  const showLanguageValue = label === 'Language' && value
  const showSubtitle = label === 'Default Address' && value

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={18} color="#8b716b" />
        <View style={styles.rowTextWrap}>
          <Text allowFontScaling={false} style={styles.rowLabel}>
            {label}
          </Text>
          {showSubtitle ? (
            <Text allowFontScaling={false} numberOfLines={1} style={styles.rowValueSubtle}>
              {value}
            </Text>
          ) : null}
        </View>
      </View>

      {showLanguageValue ? (
        <View style={styles.rowRight}>
          <Text allowFontScaling={false} style={styles.rowValue}>
            {value}
          </Text>
          <Feather name="chevron-right" size={16} color="#8b716b" />
        </View>
      ) : (
        <Feather name="chevron-right" size={16} color="#8b716b" />
      )}
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
    backgroundColor: 'rgba(247, 249, 251, 0.80)',
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
    fontSize: 24,
    lineHeight: 39,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flexGrow: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  heroCard: {
    height: 128,
    marginBottom: 24,
    borderRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7edea',
  },
  heroGlow: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroGlowPrimary: {
    width: 128,
    height: 128,
    right: -18,
    top: -62,
    backgroundColor: 'rgba(255, 122, 89, 0.20)',
  },
  heroGlowSecondary: {
    width: 96,
    height: 96,
    left: 18,
    bottom: -26,
    backgroundColor: 'rgba(107, 156, 255, 0.18)',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  panel: {
    borderRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#191c1e',
    shadowOpacity: 0.03,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionLast: {
    paddingBottom: 8,
  },
  sectionTitle: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  sectionRows: {
    marginTop: 8,
    gap: 4,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    color: '#191c1e',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  rowValue: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  rowValueSubtle: {
    marginTop: 2,
    color: '#8b716b',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  switchTrack: {
    width: 40,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 2,
    backgroundColor: '#e6e8ea',
  },
  switchTrackActive: {
    backgroundColor: '#ff7a59',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  deleteButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#ba1a1a',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  versionWrap: {
    paddingTop: 16,
    alignItems: 'center',
  },
  versionText: {
    color: '#8b716b',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.35,
    fontWeight: '400',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7f9fb',
  },
})
