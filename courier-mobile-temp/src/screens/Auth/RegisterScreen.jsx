import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { authApi } from '../../api/auth.api'

export const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', password: '', role: 'CLIENT',
  })
  const [loading, setLoading] = useState(false)

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password) {
      Alert.alert('Ошибка', 'Заполните обязательные поля')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register(form)
      if (res.success) {
        Alert.alert(
          'Успешно!',
          'Проверьте email для подтверждения аккаунта',
          [{ text: 'Войти', onPress: () => navigation.navigate('Login') }]
        )
      } else {
        Alert.alert('Ошибка', res.error?.message || 'Не удалось зарегистрироваться')
      }
    } catch (err) {
      const data = err?.response?.data
      const status = err?.response?.status
      console.log('ERROR RESPONSE:', data ? JSON.stringify(data, null, 2) : 'No response data')
      console.log('ERROR STATUS:', status || 'No status')
      
      let msg = 'Не удалось зарегистрироваться'
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

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Регистрация</Text>
        </View>

        <View style={styles.form}>
          {[
            { key: 'firstName', label: 'Имя *', placeholder: 'Иван' },
            { key: 'lastName', label: 'Фамилия', placeholder: 'Иванов' },
            { key: 'email', label: 'Email *', placeholder: 'example@mail.com', keyboard: 'email-address' },
            { key: 'phone', label: 'Телефон', placeholder: '+7 700 000 0000', keyboard: 'phone-pad' },
            { key: 'password', label: 'Пароль *', placeholder: '••••••••', secure: true },
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key} style={styles.inputWrap}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={set(key)}
                placeholder={placeholder}
                placeholderTextColor="#aaa"
                keyboardType={keyboard || 'default'}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                secureTextEntry={!!secure}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Создать аккаунт</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { flexGrow: 1, padding: 24 },
  header: { marginBottom: 24, marginTop: 40 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: '#FC3F1D', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: '#0d0d0d' },
  form: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
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
})