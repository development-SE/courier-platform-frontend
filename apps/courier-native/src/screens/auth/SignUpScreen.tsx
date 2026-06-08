import { useState } from 'react'
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_IDS } from '../../constants/screenIds'
import type { RootStackParamList } from '../../navigation/types'
import { appTheme } from '../../theme/appTheme'
import { useAuthStore } from '../../store/authStore'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.SIGN_UP>

export function SignUpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const signUp = useAuthStore((s) => s.signUp)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const heroBaseHeight = Math.max(100, Math.min(140, Math.round(windowHeight * 0.16)))
  const heroHeight = heroBaseHeight + insets.top
  const panelBottom = Math.max(14, insets.bottom + 2)
  const nameRegex = /^[a-zA-Zа-яА-Я\s-]{2,100}$/
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  const emailRegex = /^[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}$/

  const handleSignUp = async () => {
    setError('')

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (!emailRegex.test(email.trim())) {
      setError('Invalid email format.')
      return
    }

    if (!nameRegex.test(firstName.trim()) || !nameRegex.test(lastName.trim())) {
      setError('Name must be 2-100 letters.')
      return
    }

    if (!passwordRegex.test(password)) {
      setError('Password must be 8+ chars with upper, lower, digit, special.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await signUp({ email, password, firstName, lastName, phone: phone.trim() || undefined })
    setLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigation.navigate(SCREEN_IDS.SIGN_IN, { verifyEmailNotice: true })
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={[styles.heroWrap, { marginTop: -insets.top }]}>
          <ImageBackground
            source={require('../../../../../assets/Auth.png')}
            resizeMode="cover"
            style={[styles.heroImage, { height: heroHeight }]}
            imageStyle={styles.heroImageInner}
          />
        </View>

        <View style={[styles.panel, { paddingBottom: panelBottom }]}> 
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons color="#ffffff" name="arrow-back" size={18} />
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={styles.title}>Sign Up</Text>
              <Text style={styles.subtitle}>Sign up to track, send, and receive - all in one place.</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.formBlock} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#c9c6c6"
                  style={styles.input}
                />
              </View>
              <View style={styles.nameField}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#c9c6c6"
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="example@gmail.com"
              placeholderTextColor="#c9c6c6"
              style={styles.input}
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+7 (___) ___-__-__"
              placeholderTextColor="#c9c6c6"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter password"
              placeholderTextColor="#c9c6c6"
              style={styles.input}
            />

            <View style={styles.rulesBlock}>
              <Text style={styles.rulesText}>Min 8 chars · uppercase · lowercase · digit · special (@$!%*?&)</Text>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Confirm password"
              placeholderTextColor="#c9c6c6"
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable onPress={handleSignUp} disabled={loading} style={styles.signUpButton}>
              <Text style={styles.signUpButtonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#4f4a4d',
  },
  content: {
    flex: 1,
    backgroundColor: '#2d292b',
  },
  heroWrap: {
    backgroundColor: '#2d292b',
  },
  heroImage: {
    width: '100%',
  },
  heroImageInner: {
    transform: [{ translateY: 4 }, { scale: 1.01 }],
  },
  panel: {
    flex: 1,
    marginTop: -14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#4f4a4d',
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#cdc9c9',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  formBlock: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameField: {
    flex: 1,
  },
  label: {
    color: '#c9c5c5',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    marginLeft: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b4b1b2',
    color: '#acabab',
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#4f4a4d',
    fontSize: 15,
    fontWeight: '400',
  },
  rulesBlock: {
    marginTop: -3,
    marginBottom: 6,
    paddingLeft: 2,
  },
  rulesTitle: {
    color: '#cecaca',
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  rulesText: {
    color: '#bfbaba',
    fontSize: 7,
    lineHeight: 9,
    marginBottom: 1,
  },
  errorText: {
    color: '#ffd1d7',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 6,
  },
  signUpButton: {
    alignSelf: 'center',
    width: 168,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
    marginTop: 12,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
})
