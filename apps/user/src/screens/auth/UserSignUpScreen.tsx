import { useState } from 'react'
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type UserSignUpScreenProps = {
  loading?: boolean
  onBackPress?: () => void
  onSignUp?: (params: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
}

export function UserSignUpScreen({ loading = false, onBackPress, onSignUp }: UserSignUpScreenProps) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const heroBaseHeight = Math.max(100, Math.min(140, Math.round(windowHeight * 0.16)))
  const heroHeight = heroBaseHeight + insets.top
  const panelBottom = Math.max(20, insets.bottom + 10)
  const nameRegex = /^[A-Za-z\s-]{2,100}$/
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

    const result = await onSignUp?.({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || undefined,
    })
    if (result && !result.ok) {
      setError(result.message)
    }
  }

  return (
    <SafeAreaView edges={[]} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.heroWrap}>
            <ImageBackground
              source={require('../../../assets/Auth.png')}
              resizeMode="cover"
              style={[styles.heroImage, { height: heroHeight }]}
              imageStyle={styles.heroImageInner}
            />
          </View>

          <View style={[styles.panel, { paddingBottom: panelBottom }]}>
            <View style={styles.headerRow}>
              <Pressable style={styles.backButton} onPress={onBackPress}>
                <Ionicons color="#ffffff" name="arrow-back" size={18} />
              </Pressable>

              <View style={styles.headerCenter}>
                <Text allowFontScaling={false} style={styles.title}>Sign Up</Text>
                <Text allowFontScaling={false} style={styles.subtitle}>
                  Sign up to track, send, and receive - all in one place.
                </Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <ScrollView
              style={styles.formBlock}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text allowFontScaling={false} style={styles.label}>First Name</Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor="#9ca3af"
                    allowFontScaling={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.nameField}>
                  <Text allowFontScaling={false} style={styles.label}>Last Name</Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor="#9ca3af"
                    allowFontScaling={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <Text allowFontScaling={false} style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="example@gmail.com"
                placeholderTextColor="#9ca3af"
                allowFontScaling={false}
                style={styles.input}
              />

              <Text allowFontScaling={false} style={styles.label}>Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+7 (___) ___-__-__"
                placeholderTextColor="#9ca3af"
                allowFontScaling={false}
                style={styles.input}
              />

              <Text allowFontScaling={false} style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter password"
                placeholderTextColor="#9ca3af"
                allowFontScaling={false}
                style={styles.input}
              />

              <View style={styles.rulesBlock}>
                <Text allowFontScaling={false} style={styles.rulesText}>
                  Min 8 chars - uppercase - lowercase - digit - special (@$!%*?&)
                </Text>
              </View>

              <Text allowFontScaling={false} style={styles.label}>Confirm Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Confirm password"
                placeholderTextColor="#9ca3af"
                allowFontScaling={false}
                style={styles.input}
              />

              {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={() => void handleSignUp()}
                disabled={loading}
                style={styles.signUpButton}
              >
                <Text allowFontScaling={false} style={styles.signUpButtonText}>
                  {loading ? 'Signing Up...' : 'Sign Up'}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3e9dc',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#f3e9dc',
  },
  heroWrap: {
    backgroundColor: '#f3e9dc',
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
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ff7a59',
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
    color: '#050505',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 0.82)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  formBlock: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  formContent: {
    paddingBottom: 36,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameField: {
    flex: 1,
  },
  label: {
    color: '#444040',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    marginLeft: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b5b5b5',
    color: '#25272b',
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
    fontSize: 15,
    fontWeight: '400',
  },
  rulesBlock: {
    marginTop: -3,
    marginBottom: 6,
    paddingLeft: 2,
  },
  rulesText: {
    color: '#6b6565',
    fontSize: 7,
    lineHeight: 9,
    marginBottom: 1,
  },
  errorText: {
    color: '#c2412d',
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
    backgroundColor: '#ff7a59',
    marginTop: 12,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
})
