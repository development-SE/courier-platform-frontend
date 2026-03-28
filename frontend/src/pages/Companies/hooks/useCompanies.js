import { useState, useEffect, useCallback } from 'react'
import { companiesApi } from '../../../api/companies.api'

export const useCompanies = (initialPageSize = 10) => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    search: '',
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selectedIds, setSelectedIds] = useState([])

  const fetchCompanies = useCallback(async (f = filters, p = page, ps = pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const result = await companiesApi.list({ ...f, page: p, pageSize: ps })
      setCompanies(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchCompanies(filters, page, pageSize)
  }, [filters, page, pageSize, fetchCompanies])

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
      await companiesApi.create(dto)
      setSelectedIds([])
      await fetchCompanies(filters, page)
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
      await companiesApi.update(id, dto)
      setSelectedIds([])
      await fetchCompanies(filters, page)
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
      await companiesApi.remove(id)
      setSelectedIds(prev => prev.filter(cid => cid !== id))
      await fetchCompanies(filters, page)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
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
