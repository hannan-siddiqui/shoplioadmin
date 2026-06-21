import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { usersApi } from '../../lib/api'
import {
  EmptyRow,
  LoadingRow,
  MessageBanner,
  PageHeader,
  btnSecondary,
  cardClass,
} from './shared'

const roleStyles = {
  admin: 'bg-indigo-50 text-indigo-700',
  customer: 'bg-neutral-100 text-neutral-700',
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await usersApi.list({ page: 1, limit: 50 })
      setUsers(response.data?.data || [])
      setPagination(response.data?.pagination || null)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load users.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  return (
    <div>
      <PageHeader
        title="Users"
        description={`Registered accounts${pagination ? ` · ${pagination.total} total` : ''}.`}
        action={
          <button type="button" onClick={loadUsers} className={btnSecondary}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {message && <div className="mb-5"><MessageBanner message={message} /></div>}

      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-neutral-200 p-5">
          <h3 className="text-lg font-bold text-neutral-950">All users</h3>
          <p className="mt-1 text-sm text-neutral-500">Customers and administrators</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {isLoading ? (
                <LoadingRow colSpan={4} label="Loading users..." />
              ) : users.length === 0 ? (
                <EmptyRow colSpan={4} label="No users found." />
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                          {user.role === 'admin' ? (
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <UserRound className="h-4 w-4" aria-hidden="true" />
                          )}
                        </div>
                        <p className="font-semibold text-neutral-950">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutral-700">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${roleStyles[user.role] || roleStyles.customer}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Users
