import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { AntDesign, FontAwesome, Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_IDS } from '../../constants/screenIds'
import type { RootStackParamList } from '../../navigation/types'
import { useAuthStore } from '../../store/authStore'
import { appTheme } from '../../theme/appTheme'

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.SIGN_IN> & { loadingOnly?: boolean }

type SocialButtonProps = {
  label: string
  icon: ReactNode
}

function SocialButton({ label, icon }: SocialButtonProps) {
  return (
    <Pressable style={styles.socialButton}>
      <View style={styles.socialIconWrap}>{icon}</View>
      <Text style={styles.socialButtonText}>{label}</Text>
    </Pressable>
  )
}

export function SignInScreen({ navigation, route, loadingOnly = false }: Props) {
  const signIn = useAuthStore(state => state.signIn)
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const heroBaseHeight = Math.max(208, Math.min(256, Math.round(windowHeight * 0.29)))
  const heroHeight = heroBaseHeight + insets.top
  const panelBottom = Math.max(14, insets.bottom + 4)

  const verifyEmailNotice = route?.params?.verifyEmailNotice

  const handleSignIn = async () => {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn(login, password)
      if (!result.ok) {
        if (result.reason === 'NO_COURIER_PROFILE') {
          navigation.navigate(SCREEN_IDS.CREATE_COURIER_PROFILE, { email: login.trim(), password })
          return
        }
        setError(result.message || 'Invalid login or password')
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loadingOnly) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>SwiftDeliver Courier</Text>
        <Text style={styles.loadingSubtitle}>Restoring session...</Text>
      </SafeAreaView>
    )
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
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.subtitle}>Log in. Let's deliver.</Text>

          {verifyEmailNotice && (
            <View style={styles.noticeBanner}>
              <Ionicons name="mail-outline" size={14} color="#c8f7b8" />
              <Text style={styles.noticeText}>Check your email and verify your account before signing in.</Text>
            </View>
          )}

          <TextInput
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            placeholder="Login"
            placeholderTextColor="#c6c3c3"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Password"
            placeholderTextColor="#c6c3c3"
            style={styles.input}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <Text style={styles.forgotText}>Forgot password</Text>
            <Pressable
              onPress={() => void handleSignIn()}
              disabled={loading}
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialList}>
            <SocialButton
              icon={<AntDesign color="#4285f4" name="google" size={18} />}
              label="Continue with Google"
            />
            <SocialButton
              icon={<FontAwesome color="#3b5998" name="facebook-official" size={18} />}
              label="Continue with Facebook"
            />
            <SocialButton
              icon={<Ionicons color="#111111" name="logo-apple" size={18} />}
              label="Continue with Apple"
            />
          </View>

          <Pressable style={styles.signupRow} onPress={() => navigation.navigate(SCREEN_IDS.SIGN_UP)}>
            <Text style={styles.signupText}>Don’t have an account? </Text>
            <Text style={styles.signupAccent}>Sign Up</Text>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing, you automatically accept our Terms & Conditions and Privacy Policy.
          </Text>
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#4f4a4d',
    paddingTop: 20,
    paddingHorizontal: 26,
    paddingBottom: 16,
  },
  welcome: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#ccc8c8',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#1e3a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  noticeText: {
    color: '#c8f7b8',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b4b1b2',
    color: '#ffffff',
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#4f4a4d',
    fontSize: 14,
    lineHeight: 18,
  },
  errorText: {
    color: '#ffd1d7',
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
    color: appTheme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    width: 96,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.primary,
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
    backgroundColor: '#b0aaac',
    opacity: 1,
  },
  dividerText: {
    color: '#e8e4e5',
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
    backgroundColor: '#ffffff',
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
    color: '#f2f0f0',
    fontSize: 13,
  },
  signupAccent: {
    color: appTheme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    color: '#c6c2c2',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    paddingHorizontal: 4,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  loadingTitle: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
})
