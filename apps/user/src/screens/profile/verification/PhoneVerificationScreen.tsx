import { useState } from 'react'
import { Feather } from '@expo/vector-icons'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import PhoneIllustration from '../../../../assets/phone.svg'
import { styles } from '../styles'

type PhoneVerificationScreenProps = {
  onBackPress: () => void
  safeBottom: number
  safeTop: number
}

export function PhoneVerificationScreen({
  onBackPress,
  safeBottom,
  safeTop,
}: PhoneVerificationScreenProps) {
  const [countryCode, setCountryCode] = useState('+7')
  const [phoneNumber, setPhoneNumber] = useState('708 557 53 33')

  return (
    <View style={styles.nameScreen}>
      <View style={[styles.nameHeader, { paddingTop: safeTop }]}>
        <Pressable style={styles.editBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={24} color="#111111" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.nameHeaderTitle}>Phone</Text>
        <View style={styles.editHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.phoneContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text allowFontScaling={false} style={styles.nameVerificationTitle}>Phone Verification</Text>

        <View style={styles.phoneForm}>
          <View style={styles.countryInputWrap}>
            <View style={styles.flagCircle}>
              <Text allowFontScaling={false} style={styles.flagText}>KZ</Text>
            </View>
            <TextInput
              allowFontScaling={false}
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="phone-pad"
              placeholder="+7"
              placeholderTextColor="rgba(0, 0, 0, 0.35)"
              style={styles.countryInput}
            />
          </View>

          <TextInput
            allowFontScaling={false}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="708 557 53 33"
            placeholderTextColor="rgba(0, 0, 0, 0.35)"
            style={styles.phoneInput}
          />
        </View>

        <View style={styles.phoneIllustrationWrap}>
          <PhoneIllustration width={286} height={434}/>
        </View>
      </ScrollView>

      <View style={[styles.nameSaveArea, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
        <Pressable style={styles.nameSaveButton} onPress={onBackPress}>
          <Text allowFontScaling={false} style={styles.nameSaveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  )
}
