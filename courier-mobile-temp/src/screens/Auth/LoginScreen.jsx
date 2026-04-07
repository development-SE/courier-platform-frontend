import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { authApi } from '../../api/auth.api'
import { authStore } from '../../store/auth.store'

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login(email.trim(), password)
      if (res.success) {
        await authStore.saveSession(
          res.data.accessToken,
          res.data.refreshToken,
          res.data.role,
          email.trim()
        )
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
      } else {
        Alert.alert('Ошибка', res.error?.message || 'Неверный email или пароль')
      }
    } catch (err) {
      const data = err?.response?.data
      const status = err?.response?.status
      console.log('ERROR RESPONSE:', data ? JSON.stringify(data, null, 2) : 'No response data')
      console.log('ERROR STATUS:', status || 'No status')
      
      let msg = 'Неверный email или пароль'
      if (data) {
        msg = typeof data === 'string'
          ? data
          : data?.message || data?.error || data?.detail || msg
      } else if (err?.message) {
        msg = err.message
      }
      Alert.alert('Ошибка', String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.appName}>Courier</Text>
          <Text style={styles.appSub}>Доставка по городу</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Войти</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@mail.com"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#aaa"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Войти</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>Нет аккаунта? <Text style={styles.linkAccent}>Зарегистрироваться</Text></Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FC3F1D',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FC3F1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
  appName: { fontSize: 24, fontWeight: '800', color: '#0d0d0d', letterSpacing: 0.5 },
  appSub: { fontSize: 13, color: '#999', marginTop: 4 },
  form: {
    backgroundColor: '#f8f8f8', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#0d0d0d', marginBottom: 20 },
  inputWrap: { marginBottom: 16 },
  label: {
    fontSize: 12, fontWeight: '600', color: '#555',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e8e8e8',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#0d0d0d',
  },
  btn: {
    backgroundColor: '#FC3F1D', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#FC3F1D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: '#777' },
  linkAccent: { color: '#FC3F1D', fontWeight: '600' },
})
