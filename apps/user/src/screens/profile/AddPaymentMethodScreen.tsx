import { useState } from 'react'
import type { ReactNode } from 'react'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { SavedPaymentCard } from './PaymentMethodsScreen'
import { styles } from './styles'

type AddPaymentMethodScreenProps = {
  onAddCard: (card: SavedPaymentCard) => void
  onBackPress: () => void
  safeBottom: number
  safeTop: number
}

export function AddPaymentMethodScreen({
  onAddCard,
  onBackPress,
  safeBottom,
}: AddPaymentMethodScreenProps) {
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [saveCard, setSaveCard] = useState(true)

  const submitCard = () => {
    const digits = cardNumber.replace(/\D/g, '')
    const lastFourDigits = digits.slice(-4) || '7746'

    onAddCard({
      brand: 'visa',
      label: saveCard ? 'PERSONAL' : 'CARD',
      number: `**** ${lastFourDigits}`,
      selected: true,
    })
  }

  return (
    <SafeAreaView style={styles.paymentScreen} edges={['top']}>
      <View style={styles.paymentHeader}>
        <Pressable style={styles.paymentBackButton} onPress={onBackPress}>
          <Feather name="arrow-left" size={20} color="#191c1e" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.paymentHeaderTitle}>Add Payment Method</Text>
        <View style={styles.paymentHeaderSpacer} />
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.addPaymentContent, { paddingBottom: 120 + safeBottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardPreview}>
          <View style={styles.cardGlow} />
          <View style={styles.cardTopRow}>
            <View style={styles.cardChip}>
              <View style={styles.cardChipInner} />
            </View>
            <View style={styles.cardBrand}>
              <View style={styles.cardBrandCircle} />
              <View style={[styles.cardBrandCircle, styles.cardBrandOverlap]} />
            </View>
          </View>

          <View style={styles.cardPreviewBody}>
            <View>
              <Text allowFontScaling={false} style={styles.cardPreviewLabel}>CARD NUMBER</Text>
              <Text allowFontScaling={false} style={styles.cardPreviewNumber}>•••• •••• ••••{'\n'}••••</Text>
            </View>

            <View style={styles.cardPreviewBottom}>
              <View>
                <Text allowFontScaling={false} style={styles.cardPreviewLabel}>CARD HOLDER</Text>
                <Text allowFontScaling={false} style={styles.cardPreviewValue}>
                  {cardholderName.trim() ? cardholderName.toUpperCase() : 'FULL NAME'}
                </Text>
              </View>
              <View>
                <Text allowFontScaling={false} style={[styles.cardPreviewLabel, styles.cardPreviewRightText]}>
                  EXPIRES
                </Text>
                <Text allowFontScaling={false} style={[styles.cardPreviewValue, styles.cardPreviewRightText]}>
                  {expiryDate.trim() || 'MM/YY'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.addPaymentForm}>
          <PaymentField
            label="CARDHOLDER NAME"
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="e.g. James Wilson"
          />

          <PaymentField
            label="CARD NUMBER"
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
            rightIcon={<FontAwesome5 name="credit-card" size={16} color="#8b716b" />}
          />

          <View style={styles.addPaymentTwoColumn}>
            <PaymentField
              label="EXPIRY DATE"
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="MM/YY"
              fieldStyle={styles.addPaymentHalfField}
              inputStyle={styles.addPaymentCenteredInput}
            />
            <PaymentField
              label="CVC"
              value={cvc}
              onChangeText={setCvc}
              placeholder="•••"
              keyboardType="number-pad"
              fieldStyle={styles.addPaymentHalfField}
              inputStyle={styles.addPaymentCenteredInput}
              rightIcon={<Feather name="help-circle" size={13} color="#8b716b" />}
            />
          </View>

          <Pressable style={styles.saveCardRow} onPress={() => setSaveCard((current) => !current)}>
            <View style={[styles.saveCardCheck, !saveCard && styles.saveCardCheckInactive]}>
              {saveCard ? <Feather name="check" size={14} color="#ffffff" /> : null}
            </View>
            <Text allowFontScaling={false} style={styles.saveCardText}>Save card for future deliveries</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.paymentBottomAction, { paddingBottom: Math.max(24, safeBottom + 16) }]}>
        <Pressable style={styles.paymentAddButton} onPress={submitCard}>
          <Text allowFontScaling={false} style={styles.paymentAddButtonText}>Add Card</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

type PaymentFieldProps = {
  fieldStyle?: object
  inputStyle?: object
  keyboardType?: 'default' | 'number-pad'
  label: string
  onChangeText: (text: string) => void
  placeholder: string
  rightIcon?: ReactNode
  value: string
}

function PaymentField({
  fieldStyle,
  inputStyle,
  keyboardType = 'default',
  label,
  onChangeText,
  placeholder,
  rightIcon,
  value,
}: PaymentFieldProps) {
  return (
    <View style={[styles.addPaymentField, fieldStyle]}>
      <Text allowFontScaling={false} style={styles.addPaymentLabel}>{label}</Text>
      <View style={styles.addPaymentInputWrap}>
        <TextInput
          allowFontScaling={false}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="rgba(139, 113, 107, 0.60)"
          style={[styles.addPaymentInput, inputStyle]}
        />
        {rightIcon ? <View style={styles.addPaymentInputIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  )
}
