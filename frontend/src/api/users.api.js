import { api } from '../utils/api'
import { auth } from '../utils/auth'

const getEndpoint = () => {
  const session = auth.getSession()
  const role = session?.role?.toUpperCase()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  return isAdmin ? '/users' : '/employees'
}

export const usersApi = {
  async listCouriers({ search = '', page = 1, pageSize = 500 } = {}) {
    const token = auth.getToken()
    const session = auth.getSession()
    const userRole = session?.role?.toUpperCase()
    const isCompanyScoped = userRole === 'DIRECTOR' || userRole === 'PARTNER' || userRole === 'MANAGER'

    const authParams = new URLSearchParams()
    authParams.append('role', 'COURIER')
    authParams.append('page', page)
    authParams.append('size', pageSize)

    const userParams = new URLSearchParams()
    if (search) userParams.append('search', search)
    userParams.append('role', 'COURIER')
    userParams.append('page', page)
    userParams.append('size', pageSize)

    const requests = [
      api.get(`/auth/users?${authParams.toString()}`, token)
        .then(data => data.data || [])
        .catch(() => []),
    ]

    if (!isCompanyScoped) {
      requests.push(
        api.get(`/users?${userParams.toString()}`, token)
          .then(data => data.content || [])
          .catch(() => [])
      )
    }

    const results = await Promise.all(requests)
    const usersById = new Map()

    results.flat().forEach(user => {
      const id = user.userId || user.id
      if (!id) return
      usersById.set(String(id), {
        ...user,
        id,
        userId: id,
      })
    })

    const items = Array.from(usersById.values())
    return {
      items,
      total: items.length,
    }
  },

  async list({ search = '', role = '', companyId = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const session = auth.getSession()
    const callerRole = session?.role?.toUpperCase()
    
    const isSuperAdmin = callerRole === 'SUPER_ADMIN'
    const isAdmin = callerRole === 'ADMIN'
    const isDirector = callerRole === 'DIRECTOR' || callerRole === 'PARTNER'
    const isManager = callerRole === 'MANAGER'
    
    // helper to fetch employees from company-service
    const fetchEmployees = async (roleFilter = '') => {
      const p = new URLSearchParams()
      if (search) p.append('search', search)
      if (companyId) p.append('companyId', companyId)
      if (roleFilter) p.append('role', roleFilter)
      p.append('page', '1')
      p.append('size', '1000')
      
      const res = await api.get(`/employees?${p.toString()}`, token).catch(() => ({}));
      return res.content || [];
    }

    // helper to fetch and merge couriers
    const fetchCouriers = async (targetCompanyId = '') => {
      const p = new URLSearchParams()
      if (targetCompanyId) p.append('companyId', targetCompanyId)
      p.append('page', '0')
      p.append('size', '1000')
      
      const [courierProfilesRes, courierUsersRes] = await Promise.all([
        api.get(`/couriers?${p.toString()}`, token).catch(() => ({})),
        usersApi.listCouriers({ search }).catch(() => ({ items: [] }))
      ]);
      
      const profiles = courierProfilesRes.content || [];
      const usersList = courierUsersRes.items || [];
      
      const profilesMap = new Map(profiles.map(p => [String(p.id), p]));
      
      return usersList
        .filter(u => profilesMap.has(String(u.id)))
        .map(u => {
          const profile = profilesMap.get(String(u.id));
          return {
            ...u,
            companyId: profile.companyId || '',
            role: 'COURIER'
          };
        });
    }

    let allItems = [];

    if (isSuperAdmin) {
      if (role === 'ADMIN') {
        const res = await usersApi.listAdmins({ search });
        allItems = res.items || [];
      } else if (role === 'DIRECTOR' || role === 'MANAGER') {
        allItems = await fetchEmployees(role);
      } else if (role === 'COURIER') {
        allItems = await fetchCouriers(companyId);
      } else if (role === '') {
        const [employees, couriers] = await Promise.all([
          fetchEmployees(),
          fetchCouriers(companyId)
        ]);
        allItems = [...employees, ...couriers];
      }
    } else if (isAdmin) {
      if (role === 'DIRECTOR' || role === 'MANAGER') {
        allItems = await fetchEmployees(role);
      } else if (role === 'COURIER') {
        const couriers = await fetchCouriers(companyId);
        allItems = couriers.filter(c => c.companyId);
      } else if (role === '') {
        const [employees, couriers] = await Promise.all([
          fetchEmployees(),
          fetchCouriers(companyId)
        ]);
        const companyCouriers = couriers.filter(c => c.companyId);
        allItems = [...employees, ...companyCouriers];
      }
    } else if (isDirector) {
      const myCompanyId = session?.companyId;
      if (myCompanyId) {
        if (role === 'MANAGER') {
          allItems = await fetchEmployees('MANAGER');
        } else if (role === 'COURIER') {
          allItems = await fetchCouriers(myCompanyId);
        } else if (role === '') {
          const [employees, couriers] = await Promise.all([
            fetchEmployees(),
            fetchCouriers(myCompanyId)
          ]);
          const managers = employees.filter(e => e.role === 'MANAGER');
          allItems = [...managers, ...couriers];
        }
      }
    } else if (isManager) {
      const myCompanyId = session?.companyId;
      if (myCompanyId) {
        if (role === 'COURIER' || role === '') {
          allItems = await fetchCouriers(myCompanyId);
        }
      }
    }

    if (search) {
      const q = search.trim().toLowerCase();
      allItems = allItems.filter(item => 
        String(item.firstName || '').toLowerCase().includes(q) ||
        String(item.lastName || '').toLowerCase().includes(q) ||
        String(item.email || '').toLowerCase().includes(q) ||
        String(item.phone || '').toLowerCase().includes(q)
      );
    }

    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;

    return {
      items: allItems.slice(startIdx, endIdx),
      total: allItems.length,
    };
  },

  async listAdmins({ search = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    params.append('role', 'ADMIN')
    params.append('page', page)
    params.append('size', pageSize)
    if (search) params.append('search', search)

    const data = await api.get(`/auth/users?${params.toString()}`, token)
    const items = (data.data || [])
      .map(user => ({
        id: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: '',
        companyName: '---',
        companyBin: '',
        isEmailVerified: user.isEmailVerified || false,
      }))

    return {
      items,
      total: items.length,
    }
  },

  async create(dto) {
    const token = auth.getToken()
    const { companyId, ...body } = dto
    const url = companyId
      ? `/employees?companyId=${companyId}`
      : '/employees'
    const data = await api.post(url, {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: body.role,   // DIRECTOR | MANAGER
    }, token)
    return data
  },

  async update(id, dto) {
    const token = auth.getToken()
    const endpoint = getEndpoint()
    const data = await api.put(`${endpoint}/${id}`, dto, token)
    return data
  },

  async remove(id, role) {
    const token = auth.getToken()
    // Admin users are stored in auth service
    if (role === 'ADMIN') {
      await api.delete(`/auth/users/${id}`, token)
    } else {
      await api.delete(`/employees/${id}`, token)
    }
  },

  async listClients({ search = '', page = 1, pageSize = 10 } = {}) {
    const token = auth.getToken()
    const params = new URLSearchParams()
    params.append('role', 'CLIENT')
    params.append('page', page)
    params.append('size', pageSize)
    if (search) params.append('search', search)

    const data = await api.get(`/auth/users?${params.toString()}`, token)
    const items = (data.data || [])
      .map(user => ({
        id: user.userId,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'CLIENT',
        isEmailVerified: user.isEmailVerified || false,
        createdAt: user.createdAt,
      }))

    return {
      items,
      total: items.length,
    }
  },

  async removeClient(id) {
    const token = auth.getToken()
    await api.delete(`/auth/users/${id}`, token)
  },



  
}
