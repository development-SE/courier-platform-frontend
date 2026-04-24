import { useState, useEffect, useCallback } from 'react'
import { usersApi } from '../../../api/users.api'
import { companiesApi } from '../../../api/companies.api'

export const useUsers = (initialPageSize = 10, options = {}) => {
  const { canViewAdmins = false } = options
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    companyId: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedIds, setSelectedIds] = useState([])

  const fetchUsers = useCallback(async (f = filters, p = page, ps = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      let result
      if (canViewAdmins && f.role === 'ADMIN') {
        // Fetch only admins
        result = await usersApi.listAdmins({ search: f.search, page: p, pageSize: ps })
      } else if (canViewAdmins && f.role === '') {
        // Fetch all roles (employees + admins)
        const employeesResult = await usersApi.list({ ...f, page: p, pageSize: ps })
        const adminsResult = await usersApi.listAdmins({ search: f.search, page: 1, pageSize: 100 })
        const allItems = [...employeesResult.items, ...adminsResult.items]
        // Simple pagination - combine all and slice
        const startIdx = (p - 1) * ps
        const endIdx = startIdx + ps
        result = {
          items: allItems.slice(startIdx, endIdx),
          total: allItems.length
        }
      } else {
        // Fetch employees with current filters
        result = await usersApi.list({ ...f, page: p, pageSize: ps })
      }
      setUsers(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize, canViewAdmins])

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companiesApi.list({ pageSize: 100 })
      const items = Array.isArray(data) ? data : data.items
      setCompanies(items || [])
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    fetchUsers(filters, page, pageSize)
  }, [filters, page, pageSize, fetchUsers])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

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
      await usersApi.create(dto)
      setSelectedIds([])
      await fetchUsers(filters, page, pageSize)
      await fetchCompanies()
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
      await usersApi.update(id, dto)
      setSelectedIds([])
      await fetchUsers(filters, page, pageSize)
      await fetchCompanies()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, role) => {
    setLoading(true)
    setError(null)
    try {
      await usersApi.remove(id, role)
      setSelectedIds(prev => prev.filter(sid => sid !== id))
      await fetchUsers(filters, page, pageSize)
      await fetchCompanies()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    users,
    companies,
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
