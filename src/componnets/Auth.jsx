import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  AtSign,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  UserRound,
} from 'lucide-react'
import heroImage from '../assets/hero.png'
import {
  API_BASE_URL,
  api,
  clearSessionFromStorage,
  getAuthHeaders,
  getSavedToken,
  getSavedUser,
  saveSessionToStorage,
} from '../lib/api'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

const Auth = () => {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(null)
  const [token, setToken] = useState(() => getSavedToken())
  const [user, setUser] = useState(() => getSavedUser())

  const isRegisterMode = mode === 'register'

  const welcomeCopy = useMemo(() => {
    if (isRegisterMode) {
      return {
        eyebrow: 'Create account',
        title: 'Start managing your store',
        text: 'Add your details and create a secure account for the ecommerce workspace.',
        button: 'Create account',
      }
    }

    return {
      eyebrow: 'Welcome back',
      title: 'Sign in to your admin',
      text: 'Use your account credentials to continue to the ecommerce workspace.',
      button: 'Sign in',
    }
  }, [isRegisterMode])

  const fetchProfile = useCallback(async (activeToken = token) => {
    if (!activeToken) return null

    try {
      const response = await api.get('/auth/me', {
        headers: getAuthHeaders(activeToken),
      })
      const profile = response.data?.data

      if (profile) {
        saveSessionToStorage(activeToken, profile)
        setUser(profile)
      }

      return profile
    } catch {
      clearSessionFromStorage()
      setToken('')
      setUser(null)
      return null
    }
  }, [token])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setStatus(null)
    setForm((current) => ({
      name: nextMode === 'register' ? current.name : '',
      email: current.email,
      password: '',
    }))
  }

  const saveSession = (nextToken, nextUser) => {
    saveSessionToStorage(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
  }

  const clearSession = () => {
    clearSessionFromStorage()
    setToken('')
    setUser(null)
    setStatus({ type: 'success', message: 'You have been signed out.' })
  }

  const validateForm = () => {
    const trimmedEmail = form.email.trim()

    if (isRegisterMode && !form.name.trim()) {
      return 'Name is required.'
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Enter a valid email address.'
    }

    if (form.password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setStatus({ type: 'error', message: validationError })
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login'
      const payload = {
        email: form.email.trim(),
        password: form.password,
        ...(isRegisterMode ? { name: form.name.trim() } : {}),
      }

      const response = await api.post(endpoint, payload)
      const authData = response.data?.data

      if (!authData?.token || !authData?.user) {
        throw new Error('Auth response was missing session data.')
      }

      saveSession(authData.token, authData.user)
      setForm(initialForm)
      setStatus({
        type: 'success',
        message: isRegisterMode ? 'Account created successfully.' : 'Signed in successfully.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    return (
      <main className="min-h-screen bg-neutral-100 text-neutral-950">
        <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="overflow-hidden rounded-lg bg-neutral-950 text-white shadow-xl">
            <div className="relative min-h-[420px] p-8 sm:p-10">
              <img
                src={heroImage}
                alt=""
                className="absolute bottom-8 right-6 h-44 w-44 object-contain opacity-80 sm:h-60 sm:w-60"
              />
              <div className="relative z-10 max-w-md">
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase text-emerald-200">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Active session
                </span>
                <h1 className="mt-7 text-4xl font-bold leading-tight text-white sm:text-5xl">
                  Your ecommerce admin is ready.
                </h1>
                <p className="mt-4 text-base leading-7 text-neutral-300">
                  Continue building products, orders, and customer workflows from this secured
                  workspace.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-indigo-600">Signed in as</p>
                <h2 className="mt-2 text-3xl font-bold text-neutral-950">{user.name}</h2>
                <p className="mt-2 text-sm text-neutral-600">{user.email}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                {user.role || 'user'}
              </span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase text-neutral-500">API</p>
                <p className="mt-2 break-all text-sm font-medium text-neutral-800">
                  {API_BASE_URL}
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase text-neutral-500">User ID</p>
                <p className="mt-2 text-sm font-medium text-neutral-800">{user.id}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase text-neutral-500">Status</p>
                <p className="mt-2 text-sm font-medium text-neutral-800">Authenticated</p>
              </div>
            </div>

            {status && (
              <div
                className={`mt-6 rounded-lg border px-4 py-3 text-sm font-medium ${
                  status.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => fetchProfile()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Refresh profile
              </button>
              <button
                type="button"
                onClick={clearSession}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-950">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10">
        <aside className="hidden overflow-hidden rounded-lg bg-neutral-950 text-white shadow-xl lg:block">
          <div className="relative min-h-[650px] p-10">
            <div className="absolute inset-x-0 bottom-0 h-48 bg-indigo-700" aria-hidden="true" />
            <div className="absolute bottom-16 right-8 h-72 w-72 rounded-lg border border-white/10 bg-white/5" />
            <img
              src={heroImage}
              alt=""
              className="absolute bottom-20 right-16 h-72 w-72 object-contain"
            />

            <div className="relative z-10 flex h-full min-h-[570px] flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase text-emerald-200">
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Ecommerce admin
                </span>
                <h1 className="mt-7 max-w-xl text-5xl font-bold leading-tight text-white">
                  Control products, orders, and customer access.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-neutral-300">
                  Secure authentication for the team dashboard connected to your Express API.
                </p>
              </div>

              <div className="grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase text-neutral-300">Auth</p>
                  <p className="mt-2 text-sm font-semibold text-white">JWT ready</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase text-neutral-300">API</p>
                  <p className="mt-2 text-sm font-semibold text-white">Express</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold uppercase text-neutral-300">UI</p>
                  <p className="mt-2 text-sm font-semibold text-white">React</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-xl rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-2 text-xs font-semibold uppercase text-indigo-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {welcomeCopy.eyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-bold text-neutral-950 sm:text-4xl">
              {welcomeCopy.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{welcomeCopy.text}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg border border-neutral-200 bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                !isRegisterMode
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex h-11 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                isRegisterMode
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">Name</span>
                <div className="flex h-12 items-center gap-3 rounded-lg border border-neutral-300 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                  <UserRound className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden="true" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    autoComplete="name"
                    placeholder="Hannan Siddiqui"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Email</span>
              <div className="flex h-12 items-center gap-3 rounded-lg border border-neutral-300 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <AtSign className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateForm}
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Password</span>
              <div className="flex h-12 items-center gap-3 rounded-lg border border-neutral-300 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <LockKeyhole className="h-5 w-5 shrink-0 text-neutral-500" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateForm}
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  placeholder="Minimum 6 characters"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-950 outline-none placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </label>

            {status && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                  status.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-500"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : isRegisterMode ? (
                <UserPlus className="h-5 w-5" aria-hidden="true" />
              ) : (
                <LogIn className="h-5 w-5" aria-hidden="true" />
              )}
              {isSubmitting ? 'Please wait...' : welcomeCopy.button}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Auth
