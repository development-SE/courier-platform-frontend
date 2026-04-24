import { useCallback, useEffect, useState } from 'react'
import { companiesApi } from '../../api/companies.api'
import { usersApi } from '../../api/users.api'
import { addressesApi } from '../../api/addresses.api'
import { auth } from '../../utils/auth'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { CompanyAddressModal } from './components/CompanyAddressModal'
import { EmployeeModal } from './components/EmployeeModal'
import { DirectorProfileCard } from './components/DirectorProfileCard'
import { CompanyInfoCard } from './components/CompanyInfoCard'
import { CompanyAddressesSection } from './components/CompanyAddressesSection'
import { CompanyEmployeesSection } from './components/CompanyEmployeesSection'
import './myCompanyPage.css'

const mapCompanyForm = (company) => ({
  name: company?.name || '',
  bin: company?.bin || '',
})

const mapDirectorForm = (director) => ({
  firstName: director?.firstName || '',
  lastName: director?.lastName || '',
  email: director?.email || '',
  phone: director?.phone || '',
})

export const MyCompanyPage = () => {
  const session = auth.getSession()
  const currentRole = session?.role || ''
  const currentCompanyId = session?.companyId || ''
  const canEditCompanyProfile = currentRole === 'DIRECTOR' || currentRole === 'PARTNER'
  const canManageStaff = canEditCompanyProfile

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [director, setDirector] = useState(null)
  const [company, setCompany] = useState(null)

  const [companyEditMode, setCompanyEditMode] = useState(false)
  const [directorEditMode, setDirectorEditMode] = useState(false)

  const [companyForm, setCompanyForm] = useState(mapCompanyForm())
  const [directorForm, setDirectorForm] = useState(mapDirectorForm())

  const [addresses, setAddresses] = useState([])
  const [addressesTotal, setAddressesTotal] = useState(0)
  const [addressSearch, setAddressSearch] = useState('')
  const [addressPage, setAddressPage] = useState(1)
  const [addressPageSize, setAddressPageSize] = useState(10)

  const [employees, setEmployees] = useState([])
  const [employeesTotal, setEmployeesTotal] = useState(0)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeePage, setEmployeePage] = useState(1)
  const [employeePageSize, setEmployeePageSize] = useState(10)

  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [addressModalMode, setAddressModalMode] = useState('create')
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [addressModalError, setAddressModalError] = useState(null)

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false)
  const [employeeModalMode, setEmployeeModalMode] = useState('create')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [employeeModalError, setEmployeeModalError] = useState(null)

  const [deleteAddressOpen, setDeleteAddressOpen] = useState(false)
  const [deleteEmployeeOpen, setDeleteEmployeeOpen] = useState(false)

  const loadDirectorAndCompany = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const companiesData = await companiesApi.list({ page: 1, pageSize: 1000 })
      const companyData = currentCompanyId
        ? companiesData.items.find(item => item.id === currentCompanyId) || companiesData.items[0] || null
        : companiesData.items[0] || null
      setCompany(companyData)

      if (canEditCompanyProfile) {
        const usersData = await usersApi.list({ page: 1, pageSize: 1000 })
        const directorUser = usersData.items.find(user => user.role?.toUpperCase() === 'DIRECTOR') || null
        setDirector(directorUser)
      } else {
        setDirector(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [canEditCompanyProfile, currentCompanyId])

  const loadAddresses = useCallback(async (companyId) => {
    if (!companyId) {
      setAddresses([])
      setAddressesTotal(0)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await addressesApi.list({
        search: addressSearch,
        type: 'company',
        ownerId: companyId,
        page: addressPage,
        pageSize: addressPageSize,
      })
      setAddresses(result.items)
      setAddressesTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [addressSearch, addressPage, addressPageSize])

  const loadEmployees = useCallback(async (companyId) => {
    if (!canManageStaff || !companyId) {
      setEmployees([])
      setEmployeesTotal(0)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await usersApi.list({
        search: employeeSearch,
        role: 'MANAGER',
        companyId,
        page: employeePage,
        pageSize: employeePageSize,
      })
      setEmployees(result.items)
      setEmployeesTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [employeeSearch, employeePage, employeePageSize, canManageStaff])

  useEffect(() => {
    loadDirectorAndCompany()
  }, [loadDirectorAndCompany])

  useEffect(() => {
    setCompanyForm(mapCompanyForm(company))
  }, [company])

  useEffect(() => {
    setDirectorForm(mapDirectorForm(director))
  }, [director])

  useEffect(() => {
    loadAddresses(company?.id)
  }, [company?.id, loadAddresses])

  useEffect(() => {
    loadEmployees(company?.id)
  }, [company?.id, loadEmployees])

  const handleCompanyChange = (event) => {
    const { name, value } = event.target
    setCompanyForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDirectorChange = (event) => {
    const { name, value } = event.target
    setDirectorForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanySave = async () => {
    if (!company) return
    setLoading(true)
    setError(null)
    try {
      const directorName = director
        ? `${director.firstName} ${director.lastName}`.trim()
        : company.director

      const updated = await companiesApi.update(company.id, {
        name: companyForm.name,
        bin: companyForm.bin,
        director: directorName,
      })
      setCompany(updated)
      setCompanyEditMode(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectorSave = async () => {
    if (!director) return
    setLoading(true)
    setError(null)
    try {
      const updated = await usersApi.update(director.id, {
        ...directorForm,
        companyId: director.companyId,
        role: director.role || 'DIRECTOR',
      })
      setDirector(updated)
      setDirectorEditMode(false)

      if (company) {
        const directorName = `${updated.firstName} ${updated.lastName}`.trim()
        const companyUpdated = await companiesApi.update(company.id, {
          name: company.name,
          bin: company.bin,
          director: directorName,
        })
        setCompany(companyUpdated)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = () => {
    setSelectedAddress(null)
    setAddressModalMode('create')
    setAddressModalOpen(true)
    setAddressModalError(null)
  }

  const handleEditAddress = (address) => {
    setSelectedAddress(address)
    setAddressModalMode('edit')
    setAddressModalOpen(true)
    setAddressModalError(null)
  }

  const handleSaveAddress = async (formData) => {
    if (!company) return
    setAddressModalError(null)

    try {
      if (addressModalMode === 'create') {
        await addressesApi.create({
          ...formData,
          type: 'company',
          ownerId: company.id,
        })
      } else if (selectedAddress) {
        await addressesApi.update(selectedAddress.id, {
          ...formData,
          type: 'company',
          ownerId: company.id,
        })
      }
      setAddressModalOpen(false)
      setSelectedAddress(null)
      await loadAddresses(company.id)
    } catch (err) {
      setAddressModalError(err.message)
    }
  }

  const handleDeleteAddress = async () => {
    if (!selectedAddress) return
    setLoading(true)
    setError(null)
    try {
      await addressesApi.remove(selectedAddress.id)
      setDeleteAddressOpen(false)
      setSelectedAddress(null)
      await loadAddresses(company?.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmployee = () => {
    setSelectedEmployee(null)
    setEmployeeModalMode('create')
    setEmployeeModalOpen(true)
    setEmployeeModalError(null)
  }

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee)
    setEmployeeModalMode('edit')
    setEmployeeModalOpen(true)
    setEmployeeModalError(null)
  }

  const handleSaveEmployee = async (formData) => {
    if (!company) return
    setEmployeeModalError(null)

    try {
      if (employeeModalMode === 'create') {
        await usersApi.create({
          ...formData,
          companyId: company.id,
          role: 'MANAGER',
        })
      } else if (selectedEmployee) {
        await usersApi.update(selectedEmployee.id, {
          ...formData,
          companyId: company.id,
          role: 'MANAGER',
        })
      }
      setEmployeeModalOpen(false)
      setSelectedEmployee(null)
      await loadEmployees(company.id)
    } catch (err) {
      setEmployeeModalError(err.message)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return
    setLoading(true)
    setError(null)
    try {
      await usersApi.remove(selectedEmployee.id)
      setDeleteEmployeeOpen(false)
      setSelectedEmployee(null)
      await loadEmployees(company?.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="company-profile-page">
      <div className="company-profile-header">
        <h1>{canEditCompanyProfile ? '\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0434\u0438\u0440\u0435\u043a\u0442\u043e\u0440\u0430' : '\u041c\u043e\u044f \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f'}</h1>
      </div>

      {error && <div className="page-error">{error}</div>}

      <div className="profile-grid">
        {canEditCompanyProfile && (

        <DirectorProfileCard

          director={director}
          directorEditMode={directorEditMode}
          directorForm={directorForm}
          loading={loading}
          onEdit={() => setDirectorEditMode(true)}
          onSave={handleDirectorSave}
          onCancel={() => {
            setDirectorEditMode(false)
            setDirectorForm(mapDirectorForm(director))
          }}
          onChange={handleDirectorChange}
        />
        )}

        <CompanyInfoCard
          company={company}
          companyEditMode={companyEditMode}
          companyForm={companyForm}
          loading={loading}
          canEdit={canEditCompanyProfile}
          onEdit={() => setCompanyEditMode(true)}
          onSave={handleCompanySave}
          onCancel={() => {
            setCompanyEditMode(false)
            setCompanyForm(mapCompanyForm(company))
          }}
          onChange={handleCompanyChange}
        />
      </div>

      <CompanyAddressesSection
        loading={loading}
        company={company}
        addresses={addresses}
        total={addressesTotal}
        search={addressSearch}
        page={addressPage}
        pageSize={addressPageSize}
        onSearchChange={(event) => {
          setAddressSearch(event.target.value)
          setAddressPage(1)
        }}
        onPageChange={setAddressPage}
        onPageSizeChange={setAddressPageSize}
        onAdd={handleAddAddress}
        onEdit={handleEditAddress}
        onDelete={(address) => {
          setSelectedAddress(address)
          setDeleteAddressOpen(true)
        }}
      />
      {canManageStaff && (
      <CompanyEmployeesSection
        loading={loading}
        company={company}
        employees={employees}
        total={employeesTotal}
        search={employeeSearch}
        page={employeePage}
        pageSize={employeePageSize}
        onSearchChange={(event) => {
          setEmployeeSearch(event.target.value)
          setEmployeePage(1)
        }}
        onPageChange={setEmployeePage}
        onPageSizeChange={setEmployeePageSize}
        onAdd={handleAddEmployee}
        onEdit={handleEditEmployee}
        onDelete={(employee) => {
          setSelectedEmployee(employee)
          setDeleteEmployeeOpen(true)
        }}
      />
      )}

      <CompanyAddressModal
        key={`address-${addressModalMode}-${selectedAddress?.id || 'new'}-${addressModalOpen ? 'open' : 'closed'}`}
        isOpen={addressModalOpen}
        mode={addressModalMode}
        address={selectedAddress}
        onSave={handleSaveAddress}
        onCancel={() => setAddressModalOpen(false)}
        loading={loading}
        error={addressModalError}
      />

      <EmployeeModal
        key={`employee-${employeeModalMode}-${selectedEmployee?.id || 'new'}-${employeeModalOpen ? 'open' : 'closed'}`}
        isOpen={employeeModalOpen}
        mode={employeeModalMode}
        employee={selectedEmployee}
        onSave={handleSaveEmployee}
        onCancel={() => setEmployeeModalOpen(false)}
        loading={loading}
        error={employeeModalError}
      />

      <ConfirmDialog
        isOpen={deleteAddressOpen}
        title={selectedAddress ? `Удалить адрес ${selectedAddress.street}?` : 'Удалить адрес?'}
        message=""
        onConfirm={handleDeleteAddress}
        onCancel={() => setDeleteAddressOpen(false)}
        loading={loading}
      />

      <ConfirmDialog
        isOpen={deleteEmployeeOpen}
        title={selectedEmployee ? `Удалить сотрудника ${selectedEmployee.firstName} ${selectedEmployee.lastName}?` : 'Удалить сотрудника?'}
        message=""
        onConfirm={handleDeleteEmployee}
        onCancel={() => setDeleteEmployeeOpen(false)}
        loading={loading}
      />
    </div>
  )
}
