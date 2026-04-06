import { useState } from 'react'
import {
  ImageBackground,
  Pressable,
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

type Props = NativeStackScreenProps<RootStackParamList, typeof SCREEN_IDS.SIGN_UP>

export function SignUpScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()

  const [name, setName] = useState('your name')
  const [email, setEmail] = useState('example@gmail.com')
  const [password, setPassword] = useState('123456')
  const [confirmPassword, setConfirmPassword] = useState('123456')
  const [error, setError] = useState('')

  const heroBaseHeight = Math.max(186, Math.min(228, Math.round(windowHeight * 0.275)))
  const heroHeight = heroBaseHeight + insets.top
  const panelBottom = Math.max(14, insets.bottom + 2)

  const handleSignUp = () => {
    setError('')

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    navigation.navigate(SCREEN_IDS.SIGN_IN)
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

          <View style={styles.formBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#c9c6c6"
              style={styles.input}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholder="example@gmail.com"
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
              <Text style={styles.rulesTitle}>Required</Text>
              <Text style={styles.rulesText}>- The minimum password length is 6 characters.</Text>
              <Text style={styles.rulesText}>- At least one lowercase letter (for example, a, b, c).</Text>
              <Text style={styles.rulesText}>- At least one digit (for example, 1, 2, 3, 4, 5).</Text>
              <Text style={styles.rulesText}>- At least one special character (for example, #, !, %, $).</Text>
            </View>

            <Text style={styles.label}>Confirm password</Text>
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

            <Pressable onPress={handleSignUp} style={styles.signUpButton}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </Pressable>
          </View>
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
    paddingTop: 14,
    paddingHorizontal: 16,
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
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 5,
  },
  subtitle: {
    color: '#cdc9c9',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  formBlock: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  label: {
    color: '#c9c5c5',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 6,
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b4b1b2',
    color: '#acabab',
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#4f4a4d',
    fontSize: 16,
    fontWeight: '400',
  },
  rulesBlock: {
    marginTop: -3,
    marginBottom: 8,
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
    marginTop: 20,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
})
