import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
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
