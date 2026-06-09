import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '../../../api/ordersApi'
import { addressesApi } from '../../../api/addresses.api'
import { geocodeAddress } from '../../../utils/geocode'
import {
  formatPhone,
  isValidDateTime,
  isValidPhone,
  isValidRecipientName,
} from '../orderFormUtils'

const getInitialFormData = () => ({
  serviceType: '',
  comments: '',
  dropoffStreet: '',
  dropoffHouse: '',
  dropoffApartment: '',
  dropoffEntrance: '',
  recipientName: '',
  recipientPhone: '',
  pickupPoint: '',
  pickupContact: '',
  courierId: '',
  deliveryType: '',
  plannedPickupTime: '',
})

export const useOrderCreateForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [pickupPoints, setPickupPoints] = useState([])
  const [formData, setFormData] = useState(getInitialFormData)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const addressesData = await addressesApi.list({
          type: 'company',
          page: 1,
          pageSize: 1000,
        })
        setPickupPoints(addressesData.items)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const pickupOptions = useMemo(() => (
    pickupPoints.map(point => ({
      value: point.id,
      label: `${point.street}, ${point.house}${point.apartment ? `, кв. ${point.apartment}` : ''}`,
    }))
  ), [pickupPoints])

  const setFieldValue = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFieldValue(name, value)
  }

  const handlePhoneChange = (event) => {
    setFieldValue('recipientPhone', formatPhone(event.target.value))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.serviceType) nextErrors.serviceType = 'Выберите тип сервиса'

    if (!formData.dropoffStreet.trim() || formData.dropoffStreet.trim().length < 2) {
      nextErrors.dropoffStreet = 'Введите корректную улицу'
    }

    if (!formData.dropoffHouse.trim()) {
      nextErrors.dropoffHouse = 'Дом обязателен'
    }

    if (!formData.recipientName.trim() || !isValidRecipientName(formData.recipientName)) {
      nextErrors.recipientName = 'Введите имя и фамилию'
    }

    if (!formData.recipientPhone.trim()) {
      nextErrors.recipientPhone = 'Телефон обязателен'
    } else if (!isValidPhone(formData.recipientPhone)) {
      nextErrors.recipientPhone = 'Неверный формат телефона'
    }

    if (!formData.pickupPoint) nextErrors.pickupPoint = 'Выберите точку забора'

    if (!isValidDateTime(formData.plannedPickupTime)) {
      nextErrors.plannedPickupTime = 'Формат: MM/DD/YYYY HH:mm'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const resetForm = () => {
    setFormData(getInitialFormData())
    setErrors({})
  }

  const handleSave = async () => {
  if (!validate()) return
  setLoading(true)
  setSuccessMessage('')

  try {
    const selectedPickupPoint = pickupPoints.find(point => point.id === formData.pickupPoint)

    // Geocode both addresses in parallel
    const [deliveryCoords, pickupCoords] = await Promise.all([
      geocodeAddress(formData.dropoffStreet, formData.dropoffHouse),
      selectedPickupPoint?.latitude && selectedPickupPoint?.longitude
        ? Promise.resolve({ lat: selectedPickupPoint.latitude, lng: selectedPickupPoint.longitude })
        : geocodeAddress(selectedPickupPoint?.street, selectedPickupPoint?.house),
    ])

    // Split recipientName into name + surname
    const nameParts = formData.recipientName.trim().split(' ')
    const recipientFirstName = nameParts[0] || ''
    const recipientSurname = nameParts.slice(1).join(' ') || undefined

    const order = await ordersApi.create({
      serviceType:       formData.serviceType,
      comments:          formData.comments,
      dropoffStreet:     formData.dropoffStreet,
      dropoffHouse:      formData.dropoffHouse,
      dropoffApartment:  formData.dropoffApartment || undefined,
      dropoffEntrance:   formData.dropoffEntrance  || undefined,
      dropoffLat:        deliveryCoords?.lat,
      dropoffLng:        deliveryCoords?.lng,
      recipientName:     recipientFirstName,
      recipientSurname:  recipientSurname,
      recipientPhone:    formData.recipientPhone,
      pickupStreet:      selectedPickupPoint?.street || '',
      pickupHouse:       selectedPickupPoint?.house  || '',
      pickupLat:         pickupCoords?.lat,
      pickupLng:         pickupCoords?.lng,
      pickupContact:     formData.pickupContact      || 'Warehouse',
      items: [{
        itemId:   'ITEM-1',
        name:     'Package',
        quantity: 1,
      }],
    })

    setSuccessMessage(`Заказ создан: ${order.id}`)
    resetForm()
    navigate('/orders', { replace: true })
      } catch (err) {
        setErrors({ submit: err.message || 'Ошибка при создании заказа' })
      } finally {
        setLoading(false)
      }
    }
    
  const handleCancel = () => navigate('/orders')

  return {
    loading,
    successMessage,
    formData,
    errors,
    pickupOptions,
    handleChange,
    handlePhoneChange,
    handleCancel,
    handleSave,
  }
}

