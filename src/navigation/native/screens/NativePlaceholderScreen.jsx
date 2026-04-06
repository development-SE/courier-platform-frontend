import { SafeAreaView, StyleSheet, Text, View } from 'react-native'

export function NativePlaceholderScreen({ title }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Экран будет перенесен на следующих этапах.</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    color: '#f4f5f9',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#969bb2',
    fontSize: 14,
    textAlign: 'center',
  },
})
