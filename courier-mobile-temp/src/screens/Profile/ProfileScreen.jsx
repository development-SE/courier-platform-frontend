import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { authStore } from '../../store/auth.store'

export const ProfileScreen = ({ navigation }) => {
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    authStore.getRole().then((r) => setRole(r || 'CLIENT'))
    authStore.getEmail().then((value) => setEmail(value || 'Email не указан'))
  }, [])

  const handleLogout = () => {
    Alert.alert('Выйти?', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          await authStore.clearSession()
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Профиль</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.emailText}>{email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {[
          { icon: '📦', label: 'Мои заказы', onPress: () => navigation.navigate('OrdersTab') },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FC3F1D" />
        ) : (
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        )}
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#FC3F1D',
    fontWeight: '700',
  },
  spacer: { width: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0d0d0d' },

  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36 },
  emailText: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  roleText: { color: '#FC3F1D', fontWeight: '700', fontSize: 12 },

  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: 15, color: '#0d0d0d', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#ccc' },

  logoutBtn: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FC3F1D',
    backgroundColor: '#fff',
  },
  logoutText: { color: '#FC3F1D', fontWeight: '700', fontSize: 15 },
})
