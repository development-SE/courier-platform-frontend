import { Feather } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { styles } from '../styles'

type InfoRowProps = {
  label: string
  onPress?: () => void
  value?: string
}

export function InfoRow({ label, onPress, value }: InfoRowProps) {
  return (
    <Pressable style={styles.infoRow} onPress={onPress}>
      <Text allowFontScaling={false} style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        {value ? (
          <Text allowFontScaling={false} numberOfLines={1} ellipsizeMode="middle" style={styles.infoValue}>
            {value}
          </Text>
        ) : null}
        <Feather name="chevron-right" size={18} color="#111111" />
      </View>
    </Pressable>
  )
}
