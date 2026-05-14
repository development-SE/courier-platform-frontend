import { useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { InfoRow } from './components/InfoRow'
import { styles } from './styles'
import { EmailVerificationScreen } from './verification/EmailVerificationScreen'
import { NameVerificationScreen } from './verification/NameVerificationScreen'
import { PasswordVerificationScreen } from './verification/PasswordVerificationScreen'
import { PhoneVerificationScreen } from './verification/PhoneVerificationScreen'

type EditProfileScreenProps = {
  email?: string
  name: string
  onBackPress: () => void
  safeBottom: number
  safeTop: number
  width: number
}

export function EditProfileScreen({
  email,
  name,
  onBackPress,
  safeBottom,
  safeTop,
  width,
}: EditProfileScreenProps) {
  const nameProgress = useRef(new Animated.Value(0)).current
  const emailProgress = useRef(new Animated.Value(0)).current
  const phoneProgress = useRef(new Animated.Value(0)).current
  const passwordProgress = useRef(new Animated.Value(0)).current
  const [isNameOpen, setIsNameOpen] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isPhoneOpen, setIsPhoneOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const avatarSize = Math.min(112, Math.max(96, width * 0.29))
  const sidePadding = Math.min(34, Math.max(24, width * 0.07))
  const [firstName, lastName] = name.split(' ')

  const openNameScreen = () => {
    setIsNameOpen(true)
    nameProgress.setValue(0)
    Animated.timing(nameProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeNameScreen = () => {
    Animated.timing(nameProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsNameOpen(false)
      }
    })
  }

  const openEmailScreen = () => {
    setIsEmailOpen(true)
    emailProgress.setValue(0)
    Animated.timing(emailProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closeEmailScreen = () => {
    Animated.timing(emailProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsEmailOpen(false)
      }
    })
  }

  const openPhoneScreen = () => {
    setIsPhoneOpen(true)
    phoneProgress.setValue(0)
    Animated.timing(phoneProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closePhoneScreen = () => {
    Animated.timing(phoneProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPhoneOpen(false)
      }
    })
  }

  const openPasswordScreen = () => {
    setIsPasswordOpen(true)
    passwordProgress.setValue(0)
    Animated.timing(passwordProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }

  const closePasswordScreen = () => {
    Animated.timing(passwordProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPasswordOpen(false)
      }
    })
  }

  return (
    <View style={styles.editScreen}>
      <View style={[styles.editHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.editTitle}>Edit Profile</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <View style={styles.editProfileBlock}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80',
          }}
          resizeMode="cover"
          style={[
            styles.editAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
        <Text allowFontScaling={false} style={styles.editName}>{name}</Text>
        <Text allowFontScaling={false} style={styles.changePicture}>Change Picture</Text>
      </View>

      <View style={[styles.editRows, { paddingHorizontal: sidePadding }]}>
        <InfoRow label="Name" value={name} onPress={openNameScreen} />
        <InfoRow label="Email" value={email ?? 'amankeldi...@gmail.com'} onPress={openEmailScreen} />
        <InfoRow label="Phone" value="+7 707 553 55 33" onPress={openPhoneScreen} />
        <InfoRow label="Change password" onPress={openPasswordScreen} />
      </View>

      <View style={[styles.saveArea, { paddingBottom: Math.max(24, safeBottom + 16), paddingHorizontal: sidePadding + 28 }]}>
        <Pressable style={styles.saveButton} onPress={onBackPress}>
          <Text allowFontScaling={false} style={styles.saveText}>Save Changes</Text>
        </Pressable>
      </View>

      {isNameOpen && (
        <Animated.View
          style={[
            styles.editOverlay,
            {
              transform: [
                {
                  translateX: nameProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <NameVerificationScreen
            firstName={firstName || 'Aman'}
            lastName={lastName || 'Zhanatov'}
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closeNameScreen}
          />
        </Animated.View>
      )}

      {isEmailOpen && (
        <Animated.View
          style={[
            styles.editOverlay,
            {
              transform: [
                {
                  translateX: emailProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <EmailVerificationScreen
            email={email ?? 'example@gmail.com'}
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closeEmailScreen}
          />
        </Animated.View>
      )}

      {isPhoneOpen && (
        <Animated.View
          style={[
            styles.editOverlay,
            {
              transform: [
                {
                  translateX: phoneProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <PhoneVerificationScreen
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closePhoneScreen}
          />
        </Animated.View>
      )}

      {isPasswordOpen && (
        <Animated.View
          style={[
            styles.editOverlay,
            {
              transform: [
                {
                  translateX: passwordProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <PasswordVerificationScreen
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closePasswordScreen}
          />
        </Animated.View>
      )}
    </View>
  )
}
