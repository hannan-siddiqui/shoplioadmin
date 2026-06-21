import { useCallback, useEffect, useState } from 'react'
import { Loader2, PackagePlus, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { categoriesApi, productsApi } from '../../lib/api'
import {
  EmptyRow,
  LoadingRow,
  MessageBanner,
  PageHeader,
  btnPrimary,
  btnSecondary,
  cardClass,
  formatCurrency,
  inputClass,
  textareaClass,
} from './shared'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category_id: '',
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const params = {
        page: 1,
        limit: 50,
        ...(query ? { search: query } : {}),
        ...(categoryFilter ? { category_id: categoryFilter } : {}),
      }

      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.list(params),
        categoriesApi.list({ page: 1, limit: 100 }),
      ])

      setProducts(productsRes.data?.data || [])
      setPagination(productsRes.data?.pagination || null)
      setCategories(categoriesRes.data?.data || [])
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load products.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [query, categoryFilter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      category_id: String(product.category?.id || product.category_id || ''),
    })
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || form.price === '' || !form.category_id) {
      setMessage({ type: 'error', text: 'Name, price, and category are required.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock || 0),
      category_id: Number(form.category_id),
    }

    try {
      if (editingId) {
        await productsApi.update(editingId, payload)
        setMessage({ type: 'success', text: 'Product updated successfully.' })
      } else {
        await productsApi.create(payload)
        setMessage({ type: 'success', text: 'Product added to catalogue.' })
      }

      resetForm()
      await loadData()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not save product.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name} from the catalogue?`)) return

    setMessage(null)

    try {
      await productsApi.remove(product.id)
      if (editingId === product.id) resetForm()
      setMessage({ type: 'success', text: 'Product removed from catalogue.' })
      await loadData()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not delete product.',
      })
    }
  }

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`Manage catalogue items${pagination ? ` · ${pagination.total} total` : ''}.`}
      />

      {message && <div className="mb-5"><MessageBanner message={message} /></div>}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit} className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            {editingId ? (
              <Pencil className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            ) : (
              <PackagePlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            )}
            <h3 className="text-lg font-bold text-neutral-950">
              {editingId ? 'Edit product' : 'Add product'}
            </h3>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Name</span>
              <input type="text" name="name" value={form.name} onChange={updateForm} placeholder="Classic denim jacket" className={inputClass} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Description</span>
              <textarea name="description" value={form.description} onChange={updateForm} rows="3" placeholder="Short catalogue description" className={textareaClass} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Category</span>
              <select name="category_id" value={form.category_id} onChange={updateForm} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">Price</span>
                <input type="number" name="price" value={form.price} onChange={updateForm} min="0" step="0.01" placeholder="49.99" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-neutral-800">Stock</span>
                <input type="number" name="stock" value={form.stock} onChange={updateForm} min="0" step="1" placeholder="25" className={inputClass} />
              </label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className={btnPrimary}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {isSaving ? 'Saving...' : editingId ? 'Update product' : 'Add to catalogue'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className={btnSecondary}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-950">Catalogue</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {query ? `Results for "${query}"` : 'All products'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <form onSubmit={handleSearch} className="flex min-w-0 gap-2">
                <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                  <Search className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                  <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search products" className="h-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400" />
                </div>
                <button type="submit" className={btnSecondary}>
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>

              <button type="button" onClick={loadData} className={btnSecondary}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {isLoading ? (
                  <LoadingRow colSpan={5} label="Loading catalogue..." />
                ) : products.length === 0 ? (
                  <EmptyRow colSpan={5} label="No products found." />
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="max-w-[240px] px-5 py-4">
                        <p className="font-semibold text-neutral-950">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-neutral-500">{product.description || 'No description'}</p>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">{product.category?.name || '-'}</td>
                      <td className="px-5 py-4 font-semibold">{formatCurrency(product.price)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${Number(product.stock || 0) <= 5 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(product)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50" aria-label={`Edit ${product.name}`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => handleDelete(product)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50" aria-label={`Delete ${product.name}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Products
