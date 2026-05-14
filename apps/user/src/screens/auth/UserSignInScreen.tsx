import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type SocialButtonProps = {
  label: string
  icon: ReactNode
}

type UserSignInScreenProps = {
  loading?: boolean
  onSignIn?: (params: { email: string; password: string }) => Promise<{ ok: true } | { ok: false; message: string }>
  onSignUpPress?: () => void
}

function SocialButton({ label, icon }: SocialButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
      <View style={styles.socialIconWrap}>{icon}</View>
      <Text style={styles.socialButtonText}>{label}</Text>
    </Pressable>
  )
}

export function UserSignInScreen({ loading = false, onSignIn, onSignUpPress }: UserSignInScreenProps) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const heroBaseHeight = Math.max(208, Math.min(256, Math.round(windowHeight * 0.29)))
  const heroHeight = heroBaseHeight + insets.top
  const panelBottom = Math.max(22, insets.bottom + 10)

  const handleSignIn = async () => {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password')
      return
    }

    const result = await onSignIn?.({ email: email.trim(), password })
    if (result && !result.ok) {
      setError(result.message)
    }
  }

  return (
    <SafeAreaView edges={[]} style={styles.screen}>
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
          <Text allowFontScaling={false} style={styles.welcome}>Welcome!</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>Log in. Let's deliver.</Text>

          <TextInput
            value={email}
            onChangeText={text => {
              setEmail(text)
              if (error) setError('')
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            allowFontScaling={false}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={text => {
              setPassword(text)
              if (error) setError('')
            }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            allowFontScaling={false}
            style={styles.input}
          />

          {error ? <Text allowFontScaling={false} style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <Text allowFontScaling={false} style={styles.forgotText}>Forgot password</Text>
            <Pressable
              disabled={loading}
              onPress={() => void handleSignIn()}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
            >
              <Text allowFontScaling={false} style={styles.loginButtonText}>
                {loading ? '...' : 'Log in'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text allowFontScaling={false} style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialList}>
            <SocialButton
              icon={<AntDesign color="#4285f4" name="google" size={18} />}
              label="Continue with Google"
            />
            <SocialButton
              icon={<FontAwesome color="#1877f2" name="facebook-official" size={18} />}
              label="Continue with Facebook"
            />
            <SocialButton
              icon={<Ionicons color="#111111" name="logo-apple" size={18} />}
              label="Continue with Apple"
            />
          </View>

          <Pressable
            onPress={onSignUpPress}
            style={({ pressed }) => [styles.signupRow, pressed && styles.pressed]}
          >
            <Text allowFontScaling={false} style={styles.signupText}>Don't have an account? </Text>
            <Text allowFontScaling={false} style={styles.signupAccent}>Sign Up</Text>
          </Pressable>

          <Text allowFontScaling={false} style={styles.termsText}>
            By continuing, you automatically accept our Terms & Conditions and
            <Text style={styles.termsStrong}> Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3e9dc',
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingHorizontal: 26,
    paddingBottom: 16,
  },
  welcome: {
    color: '#050505',
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 0.82)',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 14,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b5b5b5',
    color: '#25272b',
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#e5e7eb',
    fontSize: 14,
    lineHeight: 18,
  },
  errorText: {
    color: '#c2412d',
    fontSize: 12,
    marginTop: -2,
    marginBottom: 8,
  },
  actionRow: {
    marginTop: 0,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotText: {
    color: '#ff7a59',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    width: 96,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a59',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d7d7d7',
    opacity: 1,
  },
  dividerText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginHorizontal: 12,
  },
  socialList: {
    gap: 10,
  },
  socialButton: {
    minHeight: 42,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  socialIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialButtonText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600',
  },
  signupRow: {
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#111111',
    fontSize: 13,
  },
  signupAccent: {
    color: '#cd5e3d',
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    color: '#444040',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    paddingHorizontal: 4,
  },
  termsStrong: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
})
