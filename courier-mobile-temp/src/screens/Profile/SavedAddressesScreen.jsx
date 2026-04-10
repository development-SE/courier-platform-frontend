import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, FlatList } from 'react-native'

export const SavedAddressesScreen = ({ navigation }) => {
  const [addresses] = useState([
    { id: '1', title: 'Дом', address: 'Астана, ул. Сарайшык 5' },
    { id: '2', title: 'Работа', address: 'Астана, пр. Туран 12' },
  ])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Мои адреса</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardAddress}>{item.address}</Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Добавить адрес</Text>
          </TouchableOpacity>
        }
      />
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardAddress: { fontSize: 14, color: '#6b7280', marginTop: 6 },
  addBtn: {
    marginTop: 8,
    backgroundColor: '#FC3F1D',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
})