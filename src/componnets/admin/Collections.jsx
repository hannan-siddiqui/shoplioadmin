import { useCallback, useEffect, useState } from 'react'
import { Layers, Loader2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react'
import { collectionsApi } from '../../lib/api'
import {
  EmptyRow,
  LoadingRow,
  MessageBanner,
  PageHeader,
  btnPrimary,
  btnSecondary,
  cardClass,
  inputClass,
  textareaClass,
} from './shared'

const emptyForm = { name: '', description: '' }

const Collections = () => {
  const [collections, setCollections] = useState([])
  const [pagination, setPagination] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const loadCollections = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await collectionsApi.list({
        page: 1,
        limit: 50,
        ...(query ? { search: query } : {}),
      })

      setCollections(response.data?.data || [])
      setPagination(response.data?.pagination || null)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load collections.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const startEdit = (collection) => {
    setEditingId(collection.id)
    setForm({
      name: collection.name || '',
      description: collection.description || '',
    })
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Collection name is required.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
    }

    try {
      if (editingId) {
        await collectionsApi.update(editingId, payload)
        setMessage({ type: 'success', text: 'Collection updated successfully.' })
      } else {
        await collectionsApi.create(payload)
        setMessage({ type: 'success', text: 'Collection created successfully.' })
      }

      resetForm()
      await loadCollections()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not save collection.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (collection) => {
    if (!window.confirm(`Delete collection "${collection.name}"?`)) return

    setMessage(null)

    try {
      await collectionsApi.remove(collection.id)
      if (editingId === collection.id) resetForm()
      setMessage({ type: 'success', text: 'Collection deleted successfully.' })
      await loadCollections()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not delete collection.',
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
        title="Collections"
        description={`Group products into curated collections${pagination ? ` · ${pagination.total} total` : ''}.`}
      />

      {message && <div className="mb-5"><MessageBanner message={message} /></div>}

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleSubmit} className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            {editingId ? (
              <Pencil className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            ) : (
              <Layers className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            )}
            <h3 className="text-lg font-bold text-neutral-950">
              {editingId ? 'Edit collection' : 'Add collection'}
            </h3>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Name</span>
              <input type="text" name="name" value={form.name} onChange={updateForm} placeholder="Summer Sale" className={inputClass} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Description</span>
              <textarea name="description" value={form.description} onChange={updateForm} rows="3" placeholder="Optional description" className={textareaClass} />
            </label>

            <div className="flex gap-3">
              <button type="submit" disabled={isSaving} className={btnPrimary}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {isSaving ? 'Saving...' : editingId ? 'Update collection' : 'Create collection'}
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
              <h3 className="text-lg font-bold text-neutral-950">All collections</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {query ? `Results for "${query}"` : 'Browse and manage collections'}
              </p>
            </div>

            <div className="flex gap-2">
              <form onSubmit={handleSearch} className="flex min-w-0 gap-2">
                <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-300 px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                  <Search className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
                  <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search collections" className="h-full min-w-0 bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400" />
                </div>
                <button type="submit" className={btnSecondary}>
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
              <button type="button" onClick={loadCollections} className={btnSecondary}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                <tr>
                  <th className="px-5 py-3">Collection</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {isLoading ? (
                  <LoadingRow colSpan={5} label="Loading collections..." />
                ) : collections.length === 0 ? (
                  <EmptyRow colSpan={5} label="No collections found." />
                ) : (
                  collections.map((collection) => (
                    <tr key={collection.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-neutral-950">{collection.name}</p>
                        <p className="mt-1 text-xs text-neutral-500">{collection.description || 'No description'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-600">
                          {collection.slug}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                          {collection.product_count ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {collection.created_at ? new Date(collection.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEdit(collection)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50" aria-label={`Edit ${collection.name}`}>
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => handleDelete(collection)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50" aria-label={`Delete ${collection.name}`}>
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

export default Collections
