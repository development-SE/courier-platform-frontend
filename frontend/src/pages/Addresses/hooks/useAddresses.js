import { useState, useEffect, useCallback } from 'react'
import { addressesApi } from '../../../api/addresses.api'
import { companiesApi } from '../../../api/companies.api'
import { usersApi } from '../../../api/users.api'

export const useAddresses = (initialPageSize = 10) => {
  const [addresses, setAddresses] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    search: '',
    type: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedIds, setSelectedIds] = useState([])

  const fetchAddresses = useCallback(async (f = filters, p = page, ps = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const result = await addressesApi.list({ ...f, page: p, pageSize: ps })
      setAddresses(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companiesApi.list()
      const items = Array.isArray(data) ? data : data.items
      setCompanies(items || [])
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const [employeesRes, clientsRes, couriersRes] = await Promise.all([
        usersApi.list({ page: 1, pageSize: 1000 }),
        usersApi.listClients({ page: 1, pageSize: 1000 }),
        usersApi.listCouriers({ page: 1, pageSize: 1000 }),
      ])
      
      const allUsers = [
        ...(employeesRes.items || []),
        ...(clientsRes.items || []),
        ...(couriersRes.items || []),
      ]
      
      // Remove duplicates by id
      const uniqueUsersMap = new Map()
      allUsers.forEach(u => {
        if (u && u.id) {
          uniqueUsersMap.set(String(u.id), u)
        }
      })
      
      setUsers(Array.from(uniqueUsersMap.values()))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    fetchAddresses(filters, page, pageSize)
  }, [filters, page, pageSize, fetchAddresses])

  useEffect(() => {
    fetchCompanies()
    fetchUsers()
  }, [fetchCompanies, fetchUsers])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    setSelectedIds([])
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    setSelectedIds([])
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setPage(1)
    setSelectedIds([])
  }

  const handleCreate = async (dto) => {
    setLoading(true)
    setError(null)
    try {
      await addressesApi.create(dto)
      setSelectedIds([])
      await fetchAddresses(filters, page, pageSize)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id, dto) => {
    setLoading(true)
    setError(null)
    try {
      await addressesApi.update(id, dto)
      setSelectedIds([])
      await fetchAddresses(filters, page, pageSize)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setLoading(true)
    setError(null)
    try {
      await addressesApi.remove(id)
      setSelectedIds(prev => prev.filter(aid => aid !== id))
      await fetchAddresses(filters, page, pageSize)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    addresses,
    companies,
    users,
    loading,
    error,
    total,
    filters,
    page,
    pageSize,
    selectedIds,
    setSelectedIds,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
