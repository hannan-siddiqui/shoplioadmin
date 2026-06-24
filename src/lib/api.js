import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const TOKEN_KEY = 'ecommerceAdminToken'
export const USER_KEY = 'ecommerceAdminUser'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getSavedUser = () => {
  const savedUser = localStorage.getItem(USER_KEY)

  if (!savedUser) return null

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export const getSavedToken = () => localStorage.getItem(TOKEN_KEY) || ''

export const saveSessionToStorage = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearSessionFromStorage = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
})

api.interceptors.request.use((config) => {
  const token = getSavedToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      const isAuthRoute = error.config?.url?.includes('/auth/login')
        || error.config?.url?.includes('/auth/register')

      if (!isAuthRoute) {
        clearSessionFromStorage()
        window.location.href = '/'
      }
    }

    return Promise.reject(error)
  },
)

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenue: () => api.get('/dashboard/revenue'),
  getRecentOrders: (limit = 10) => api.get('/dashboard/recent-orders', { params: { limit } }),
  getTopProducts: (limit = 5) => api.get('/dashboard/top-products', { params: { limit } }),
}

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
}

export const categoriesApi = {
  list: (params) => api.get('/categories', { params }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
}

export const collectionsApi = {
  list: (params) => api.get('/collections', { params }),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  remove: (id) => api.delete(`/collections/${id}`),
}

export const ordersApi = {
  list: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
}

export const usersApi = {
  list: (params) => api.get('/users', { params }),
}
