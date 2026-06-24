import { useCallback, useEffect, useState } from 'react'
import { Check, Loader2, PackagePlus, Pencil, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { categoriesApi, collectionsApi, productsApi } from '../../lib/api'
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
  categoryIds: [],
  collectionIds: [],
}

/** Reusable multi-select checkbox dropdown */
const MultiSelect = ({ label, options, selected, onChange, placeholder = 'Select…' }) => {
  const [open, setOpen] = useState(false)

  const toggle = (id) => {
    onChange(
      selected.includes(id)
        ? selected.filter((v) => v !== id)
        : [...selected, id],
    )
  }

  const selectedNames = options
    .filter((o) => selected.includes(o.id))
    .map((o) => o.name)

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-800">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-neutral-300 px-3 text-left text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <span className={`truncate ${selectedNames.length === 0 ? 'text-neutral-400' : 'text-neutral-900'}`}>
            {selectedNames.length === 0 ? placeholder : selectedNames.join(', ')}
          </span>
          <span className="shrink-0 text-xs font-semibold text-indigo-600">
            {selected.length > 0 ? `${selected.length}` : ''}
          </span>
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg">
              {options.length === 0 ? (
                <p className="px-3 py-3 text-sm text-neutral-400">No options available</p>
              ) : (
                options.map((option) => {
                  const isSelected = selected.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggle(option.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-neutral-50 ${
                        isSelected ? 'font-semibold text-indigo-700' : 'text-neutral-700'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-neutral-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      {option.name}
                    </button>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Selected chips */}
      {selectedNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options
            .filter((o) => selected.includes(o.id))
            .map((o) => (
              <span
                key={o.id}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
              >
                {o.name}
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="rounded-full p-0.5 transition hover:bg-indigo-100"
                  aria-label={`Remove ${o.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  )
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [pagination, setPagination] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('')
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
        ...(collectionFilter ? { collection: collectionFilter } : {}),
      }

      const [productsRes, categoriesRes, collectionsRes] = await Promise.all([
        productsApi.list(params),
        categoriesApi.list({ page: 1, limit: 100 }),
        collectionsApi.list({ page: 1, limit: 100 }),
      ])

      setProducts(productsRes.data?.data || [])
      setPagination(productsRes.data?.pagination || null)
      setCategories(categoriesRes.data?.data || [])
      setCollections(collectionsRes.data?.data || [])
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load products.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [query, categoryFilter, collectionFilter])

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
      categoryIds: (product.categories || []).map((c) => c.id),
      collectionIds: (product.collections || []).map((c) => c.id),
    })
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim() || form.price === '') {
      setMessage({ type: 'error', text: 'Name and price are required.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock: Number(form.stock || 0),
      categoryIds: form.categoryIds,
      collectionIds: form.collectionIds,
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

            <MultiSelect
              label="Categories"
              options={categories}
              selected={form.categoryIds}
              onChange={(ids) => setForm((f) => ({ ...f, categoryIds: ids }))}
              placeholder="Select categories"
            />

            <MultiSelect
              label="Collections"
              options={collections}
              selected={form.collectionIds}
              onChange={(ids) => setForm((f) => ({ ...f, collectionIds: ids }))}
              placeholder="Select collections"
            />

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

              <select
                value={collectionFilter}
                onChange={(event) => setCollectionFilter(event.target.value)}
                className="h-11 rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All collections</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.slug}>{collection.name}</option>
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
                  <th className="px-5 py-3">Categories</th>
                  <th className="px-5 py-3">Collections</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {isLoading ? (
                  <LoadingRow colSpan={6} label="Loading catalogue..." />
                ) : products.length === 0 ? (
                  <EmptyRow colSpan={6} label="No products found." />
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50">
                      <td className="max-w-[200px] px-5 py-4">
                        <p className="font-semibold text-neutral-950">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-neutral-500">{product.description || 'No description'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(product.categories || []).length > 0
                            ? product.categories.map((c) => (
                                <span key={c.id} className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                  {c.name}
                                </span>
                              ))
                            : <span className="text-neutral-400">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(product.collections || []).length > 0
                            ? product.collections.map((c) => (
                                <span key={c.id} className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                                  {c.name}
                                </span>
                              ))
                            : <span className="text-neutral-400">—</span>}
                        </div>
                      </td>
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
