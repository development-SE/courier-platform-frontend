import { useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EditProfileScreen } from './EditProfileScreen'
import { PaymentMethodsScreen } from './PaymentMethodsScreen'
import { SettingsScreen } from './SettingsScreen'
import { styles } from './styles'
import { logoutAll } from '../../data/authApi'
import { unregisterDevice } from '../../data/notificationsApi'

type UserProfileScreenProps = {
  accessToken: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  onHomePress?: () => void
  onOrdersPress?: () => void
  onProfileUpdated?: (data: { firstName: string; lastName: string; email: string; phone: string }) => void
  onSignOut?: () => void
}

const menuItems = [
  'Personal information',
  'Payment methods',
  'Order history',
  'Support',
  'Settings',
]

export function UserProfileScreen({
  accessToken,
  email: initialEmail,
  firstName: initialFirstName,
  lastName: initialLastName,
  phone: initialPhone,
  onHomePress,
  onProfileUpdated,
  onSignOut,
}: UserProfileScreenProps) {
  const insets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()
  const editProgress = useRef(new Animated.Value(0)).current
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  const handleSignOut = async () => {
    unregisterDevice(accessToken).catch(() => {})
    onSignOut?.()
  }

  const handleLogoutAll = () => {
    Alert.alert(
      'Log out from all devices?',
      'This will terminate all active sessions on all devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOutAll(true)
            try {
              await unregisterDevice(accessToken).catch(() => {})
              await logoutAll(accessToken)
            } catch (err) {
              console.warn('Logout all failed:', err)
            } finally {
              setLoggingOutAll(false)
              onSignOut?.()
            }
          },
        },
      ]
    )
  }
  const paymentProgress = useRef(new Animated.Value(0)).current
  const settingsProgress = useRef(new Animated.Value(0)).current
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const heroHeight = Math.min(238, Math.max(202, height * 0.27))
  const avatarSize = Math.min(116, Math.max(96, width * 0.28))
  const horizontalPadding = Math.min(70, Math.max(32, width * 0.11))

  const [profileFirstName, setProfileFirstName] = useState(initialFirstName ?? '')
  const [profileLastName, setProfileLastName] = useState(initialLastName ?? '')
  const [profileEmail, setProfileEmail] = useState(initialEmail ?? '')
  const [profilePhone, setProfilePhone] = useState(initialPhone ?? '')

  const displayName = [profileFirstName, profileLastName].filter(Boolean).join(' ') || 'User'

  const openEditProfile = () => {
    setIsEditOpen(true)
    editProgress.setValue(0)
    Animated.timing(editProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeEditProfile = () => {
    Animated.timing(editProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsEditOpen(false)
      }
    })
  }

  const openPaymentMethods = () => {
    setIsPaymentOpen(true)
    paymentProgress.setValue(0)
    Animated.timing(paymentProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closePaymentMethods = () => {
    Animated.timing(paymentProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPaymentOpen(false)
      }
    })
  }

  const openSettings = () => {
    setIsSettingsOpen(true)
    settingsProgress.setValue(0)
    Animated.timing(settingsProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeSettings = () => {
    Animated.timing(settingsProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsSettingsOpen(false)
      }
    })
  }

  const handleMenuItemPress = (item: string) => {
    if (item === 'Personal information') {
      openEditProfile()
      return
    }

    if (item === 'Payment methods') {
      openPaymentMethods()
      return
    }

    if (item === 'Settings') {
      openSettings()
    }
  }

  const handleProfileUpdated = (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    setProfileFirstName(data.firstName)
    setProfileLastName(data.lastName)
    setProfileEmail(data.email)
    setProfilePhone(data.phone)
    onProfileUpdated?.(data)
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        bounces
        alwaysBounceVertical
        overScrollMode="auto"
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { minHeight: height, paddingBottom: 32 + insets.bottom }]}
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
          }}
          resizeMode="cover"
          style={[styles.hero, { height: heroHeight + insets.top }]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <Pressable style={styles.backButton} onPress={onHomePress}>
              <Feather name="arrow-left" size={22} color="#58423c" />
            </Pressable>
            <Text allowFontScaling={false} style={styles.headerTitle}>My Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
        </ImageBackground>

        <View style={[styles.profilePanel, { paddingHorizontal: horizontalPadding }]}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80',
            }}
            resizeMode="cover"
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                marginTop: -avatarSize / 2,
                borderRadius: avatarSize / 2,
              },
            ]}
          />

          <View style={styles.identity}>
            <Text allowFontScaling={false} style={styles.name}>{displayName}</Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.editProfile}>
              {profileEmail ? profileEmail : 'Edit Profile'}
            </Text>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Pressable
                key={item}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <Text allowFontScaling={false} style={styles.menuText}>{item}</Text>
                <Feather name="chevron-right" size={18} color="#111111" />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutButton} onPress={handleSignOut}>
            <Text allowFontScaling={false} style={styles.logoutText}>Log out</Text>
          </Pressable>

          <Pressable
            style={[styles.logoutButton, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#ff7a59' }]}
            onPress={handleLogoutAll}
            disabled={loggingOutAll}
          >
            <Text allowFontScaling={false} style={[styles.logoutText, { color: '#ff7a59' }]}>Log out from all devices</Text>
          </Pressable>
        </View>
      </ScrollView>

      {isEditOpen && (
        <Animated.View
          style={[
            styles.paymentOverlay,
            {
              transform: [
                {
                  translateX: editProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <EditProfileScreen
            accessToken={accessToken}
            email={profileEmail}
            name={displayName}
            phone={profilePhone}
            safeTop={insets.top}
            safeBottom={insets.bottom}
            width={width}
            onBackPress={closeEditProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        </Animated.View>
      )}

      {isPaymentOpen && (
        <Animated.View
          style={[
            styles.editOverlay,
            {
              transform: [
                {
                  translateX: paymentProgress.interpolate({
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
            safeBottom={insets.bottom}
            onBackPress={closePaymentMethods}
          />
        </Animated.View>
      )}

      {isSettingsOpen && (
        <Animated.View
          style={[
            styles.paymentOverlay,
            {
              transform: [
                {
                  translateX: settingsProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <SettingsScreen safeBottom={insets.bottom} onBackPress={closeSettings} accessToken={accessToken} />
        </Animated.View>
      )}
    </View>
  )
}
