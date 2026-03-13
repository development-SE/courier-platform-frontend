import { OrderBasicSection } from './components/OrderBasicSection'
import { OrderDropoffSection } from './components/OrderDropoffSection'
import { OrderPickupSection } from './components/OrderPickupSection'
import { useOrderCreateForm } from './hooks/useOrderCreateForm'
import './orderCreatePage.css'

export const OrderCreatePage = () => {
  const {
    loading,
    successMessage,
    formData,
    errors,
    pickupOptions,
    handleChange,
    handlePhoneChange,
    handleCancel,
    handleSave,
  } = useOrderCreateForm()

  return (
    <div className="order-create-page">
      <div className="order-header">
        <h1>Process Order</h1>
        <p>Создание нового заказа</p>
      </div>

      {successMessage && <div className="order-success">{successMessage}</div>}

      <OrderBasicSection
        formData={formData}
        errors={errors}
        onChange={handleChange}
      />

      <OrderDropoffSection
        formData={formData}
        errors={errors}
        onChange={handleChange}
        onPhoneChange={handlePhoneChange}
      />

      <OrderPickupSection
        formData={formData}
        errors={errors}
        pickupOptions={pickupOptions}
        onChange={handleChange}
      />

      <div className="order-actions">
        <button
          type="button"
          className="btn-outline"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => handleSave(false)}
          disabled={loading}
        >
          Save
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => handleSave(true)}
          disabled={loading}
        >
          Save & Assign
        </button>
      </div>
    </div>
  )
}

