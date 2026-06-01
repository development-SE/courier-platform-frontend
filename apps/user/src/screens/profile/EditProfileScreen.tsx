import { useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { updateUserProfile } from '../../data/profileApi'
import { InfoRow } from './components/InfoRow'
import { styles } from './styles'
import { EmailVerificationScreen } from './verification/EmailVerificationScreen'
import { NameVerificationScreen } from './verification/NameVerificationScreen'
import { PasswordVerificationScreen } from './verification/PasswordVerificationScreen'
import { PhoneVerificationScreen } from './verification/PhoneVerificationScreen'

type ProfileData = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

type EditProfileScreenProps = {
  accessToken: string
  email: string
  name: string
  phone: string
  onBackPress: () => void
  onProfileUpdated: (data: ProfileData) => void
  safeBottom: number
  safeTop: number
  width: number
}

export function EditProfileScreen({
  accessToken,
  email,
  name,
  phone,
  onBackPress,
  onProfileUpdated,
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

  const [currentName, setCurrentName] = useState(name)
  const [currentEmail, setCurrentEmail] = useState(email)
  const [currentPhone, setCurrentPhone] = useState(phone)

  const avatarSize = Math.min(112, Math.max(96, width * 0.29))
  const sidePadding = Math.min(34, Math.max(24, width * 0.07))
  const [firstName, lastName] = currentName.split(' ')

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

  const handleNameSave = async (newFirstName: string, newLastName: string) => {
    const response = await updateUserProfile(accessToken, {
      firstName: newFirstName,
      lastName: newLastName,
    })

    if (!response.ok) {
      return { ok: false, message: response.error.message }
    }

    if (!response.data.success) {
      return { ok: false, message: response.data.error?.message ?? response.data.message ?? 'Failed to update name' }
    }

    const newName = `${newFirstName} ${newLastName}`
    setCurrentName(newName)
    onProfileUpdated({
      firstName: newFirstName,
      lastName: newLastName,
      email: currentEmail,
      phone: currentPhone,
    })
    return { ok: true }
  }

  const handleEmailSave = async (newEmail: string) => {
    const response = await updateUserProfile(accessToken, { email: newEmail })

    if (!response.ok) {
      return { ok: false, message: response.error.message }
    }

    if (!response.data.success) {
      return { ok: false, message: response.data.error?.message ?? response.data.message ?? 'Failed to update email' }
    }

    setCurrentEmail(newEmail)
    onProfileUpdated({
      firstName: firstName || '',
      lastName: lastName || '',
      email: newEmail,
      phone: currentPhone,
    })
    return { ok: true }
  }

  const handlePhoneSave = async (newPhone: string) => {
    const response = await updateUserProfile(accessToken, { phone: newPhone })

    if (!response.ok) {
      return { ok: false, message: response.error.message }
    }

    if (!response.data.success) {
      return { ok: false, message: response.data.error?.message ?? response.data.message ?? 'Failed to update phone' }
    }

    setCurrentPhone(newPhone)
    onProfileUpdated({
      firstName: firstName || '',
      lastName: lastName || '',
      email: currentEmail,
      phone: newPhone,
    })
    return { ok: true }
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
        <Text allowFontScaling={false} style={styles.editName}>{currentName}</Text>
        <Text allowFontScaling={false} style={styles.changePicture}>Change Picture</Text>
      </View>

      <View style={[styles.editRows, { paddingHorizontal: sidePadding }]}>
        <InfoRow label="Name" value={currentName} onPress={openNameScreen} />
        <InfoRow label="Email" value={currentEmail} onPress={openEmailScreen} />
        <InfoRow label="Phone" value={currentPhone || '+7 707 553 55 33'} onPress={openPhoneScreen} />
        <InfoRow label="Change password" onPress={openPasswordScreen} />
      </View>

      <View style={[styles.saveArea, { paddingBottom: Math.max(24, safeBottom + 16), paddingHorizontal: sidePadding + 28 }]}>
        <Pressable style={styles.saveButton} onPress={onBackPress}>
          <Text allowFontScaling={false} style={styles.saveText}>Done</Text>
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
            firstName={firstName || ''}
            lastName={lastName || ''}
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closeNameScreen}
            onSave={handleNameSave}
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
            email={currentEmail}
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closeEmailScreen}
            onSave={handleEmailSave}
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
            phone={currentPhone}
            safeBottom={safeBottom}
            safeTop={safeTop}
            onBackPress={closePhoneScreen}
            onSave={handlePhoneSave}
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
