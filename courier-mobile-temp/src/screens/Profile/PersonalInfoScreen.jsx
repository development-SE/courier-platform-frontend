import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { authStore } from '../../store/auth.store'

export const PersonalInfoScreen = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    authStore.getEmail().then((value) => setEmail(value || 'Email не указан'))
    authStore.getRole().then((value) => setRole(value || 'CLIENT'))
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Личные данные</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>

        <Text style={styles.label}>Роль</Text>
        <Text style={styles.value}>{role}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FC3F1D', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: '#0d0d0d' },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 10, textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#111827', fontWeight: '600', marginTop: 4 },
})