import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Boxes,
  DollarSign,
  Loader2,
  LogOut,
  PackagePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react'
import heroImage from '../assets/hero.png'
import {
  API_BASE_URL,
  api,
  clearSessionFromStorage,
  getAuthHeaders,
  getSavedToken,
  getSavedUser,
} from '../lib/api'

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const formatCurrency = (value) => currency.format(Number(value || 0))

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [token] = useState(() => getSavedToken())
  const [user] = useState(() => getSavedUser())
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [invalidSession, setInvalidSession] = useState(false)

  const stats = useMemo(() => {
    const inventoryValue = products.reduce((total, product) => {
      return total + Number(product.price || 0) * Number(product.stock || 0)
    }, 0)
    const lowStockCount = products.filter((product) => Number(product.stock || 0) <= 5).length
    const pendingOrders = orders.filter((order) => order.status === 'pending').length
    const revenue = orders.reduce((total, order) => total + Number(order.total || 0), 0)

    return {
      totalProducts: pagination?.total ?? products.length,
      inventoryValue,
      lowStockCount,
      totalOrders: orders.length,
      pendingOrders,
      revenue,
    }
  }, [orders, pagination, products])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    const productParams = {
      page: 1,
      limit: 50,
      ...(query ? { search: query } : {}),
    }

    const [productsResult, ordersResult] = await Promise.allSettled([
      api.get('/products', { params: productParams }),
      api.get('/orders', { headers: getAuthHeaders(token), params: { page: 1, limit: 10 } }),
    ])

    if (productsResult.status === 'fulfilled') {
      setProducts(productsResult.value.data?.data || [])
      setPagination(productsResult.value.data?.pagination || null)
    } else {
      setProducts([])
      setPagination(null)
    }

    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value.data?.data || [])
    } else {
      const status = ordersResult.reason?.response?.status

      if (status === 401 || status === 403) {
        clearSessionFromStorage()
        setInvalidSession(true)
        return
      }

      setOrders([])
    }

    if (productsResult.status === 'rejected') {
      setMessage({
        type: 'error',
        text: productsResult.reason?.response?.data?.message || 'Could not load catalogue.',
      })
    }

    setIsLoading(false)
  }, [query, token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard()
  }, [loadDashboard])

  const updateProductForm = (event) => {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  const handleCreateProduct = async (event) => {
    event.preventDefault()

    if (!productForm.name.trim() || productForm.price === '') {
      setMessage({ type: 'error', text: 'Product name and price are required.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await api.post('/products', {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0),
      }, {
        headers: getAuthHeaders(token),
      })
      setProductForm(emptyProductForm)
      setMessage({ type: 'success', text: 'Product added to catalogue.' })
      await loadDashboard()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not create product.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete ${product.name} from the catalogue?`)

    if (!confirmed) return

    setMessage(null)

    try {
      await api.delete(`/products/${product.id}`, {
        headers: getAuthHeaders(token),
      })
      setMessage({ type: 'success', text: 'Product removed from catalogue.' })
      await loadDashboard()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not delete product.',
      })
    }
  }

  const logout = () => {
    clearSessionFromStorage()
    navigate('/', { replace: true })
  }

  if (!token || invalidSession || user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-950 text-white">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-700">Admin workspace</p>
              <h1 className="text-2xl font-bold text-neutral-950">Ecommerce control panel</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 py-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg bg-neutral-950 p-6 text-white">
            <div className="grid gap-6 md:grid-cols-[1fr_180px] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase text-emerald-200">
                  <Boxes className="h-4 w-4" aria-hidden="true" />
                  Catalogue command
                </span>
                <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
                  Manage products and track store activity.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
                  API base: {API_BASE_URL}
                </p>
              </div>
              <img src={heroImage} alt="" className="mx-auto h-40 w-40 object-contain md:mx-0" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-500">Inventory value</p>
                <DollarSign className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-bold text-neutral-950">
                {formatCurrency(stats.inventoryValue)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-500">Open orders</p>
                <Truck className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-bold text-neutral-950">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Products', stats.totalProducts],
            ['Low stock', stats.lowStockCount],
            ['Recent orders', stats.totalOrders],
            ['Recent revenue', formatCurrency(stats.revenue)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
            </div>
          ))}
        </div>

        {message && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
              message.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {message.text}
          </div>
        )}

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <form
            onSubmit={handleCreateProduct}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <PackagePlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-neutral-950">Add product</h2>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">Name</span>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={updateProductForm}
                  placeholder="Classic denim jacket"
                  className="h-11 w-full rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">
                  Description
                </span>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={updateProductForm}
                  rows="4"
                  placeholder="Short catalogue description"
                  className="w-full resize-none rounded-md border border-neutral-300 px-3 py-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">Price</span>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={updateProductForm}
                    min="0"
                    step="0.01"
                    placeholder="49.99"
                    className="h-11 w-full rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-neutral-800">Stock</span>
                  <input
                    type="number"
                    name="stock"
                    value={productForm.stock}
                    onChange={updateProductForm}
                    min="0"
                    step="1"
                    placeholder="25"
                    className="h-11 w-full rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-500"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PackagePlus className="h-4 w-4" aria-hidden="true" />
                )}
                {isSaving ? 'Saving...' : 'Add to catalogue'}
              </button>
            </div>
          </form>

          <section className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-neutral-950">Catalogue</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {query ? `Showing results for "${query}"` : 'All products'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <form onSubmit={handleSearch} className="flex min-w-0 gap-2">
                  <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                    <Search className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search products"
                      className="h-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    Search
                  </button>
                </form>
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-neutral-500">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Loading catalogue...
                        </span>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-neutral-500">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-neutral-50">
                        <td className="max-w-[280px] px-5 py-4">
                          <p className="font-semibold text-neutral-950">{product.name}</p>
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {product.description || 'No description'}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-neutral-800">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                              Number(product.stock || 0) <= 5
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">
                          {product.created_at
                            ? new Date(product.created_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
