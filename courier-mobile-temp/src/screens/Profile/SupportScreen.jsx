import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native'

export const SupportScreen = ({ navigation }) => {
  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/77000000000')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Поддержка</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title2}>Нужна помощь?</Text>
        <Text style={styles.text}>Свяжитесь с нами в WhatsApp или по email.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={openWhatsApp}>
          <Text style={styles.primaryBtnText}>Написать в WhatsApp</Text>
        </TouchableOpacity>
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
  title2: { fontSize: 18, fontWeight: '700', color: '#111827' },
  text: { fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 20 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#FC3F1D',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
})