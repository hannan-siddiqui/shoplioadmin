import { useCallback, useEffect, useState } from 'react'
import { Eye, Loader2, RefreshCw, X } from 'lucide-react'
import { ordersApi } from '../../lib/api'
import {
  EmptyRow,
  LoadingRow,
  MessageBanner,
  ORDER_STATUSES,
  PageHeader,
  btnSecondary,
  cardClass,
  formatCurrency,
  statusStyles,
} from './shared'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState(null)

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await ordersApi.list({
        page: 1,
        limit: 50,
        ...(statusFilter ? { status: statusFilter } : {}),
      })

      setOrders(response.data?.data || [])
      setPagination(response.data?.pagination || null)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load orders.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const openDetail = async (order) => {
    setIsDetailLoading(true)
    setMessage(null)

    try {
      const response = await ordersApi.getById(order.id)
      setSelectedOrder(response.data?.data || null)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load order details.',
      })
    } finally {
      setIsDetailLoading(false)
    }
  }

  const closeDetail = () => setSelectedOrder(null)

  const handleStatusChange = async (orderId, status) => {
    setIsUpdating(true)
    setMessage(null)

    try {
      const response = await ordersApi.updateStatus(orderId, status)
      const updated = response.data?.data

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: updated.status } : order)),
      )

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((current) => ({ ...current, status: updated.status }))
      }

      setMessage({ type: 'success', text: 'Order status updated successfully.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not update order status.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`Track and fulfil customer orders${pagination ? ` · ${pagination.total} total` : ''}.`}
        action={
          <button type="button" onClick={loadOrders} className={btnSecondary}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {message && <div className="mb-5"><MessageBanner message={message} /></div>}

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">All orders</h3>
            <p className="mt-1 text-sm text-neutral-500">Filter by status and update fulfilment</p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {isLoading ? (
                <LoadingRow colSpan={7} label="Loading orders..." />
              ) : orders.length === 0 ? (
                <EmptyRow colSpan={7} label="No orders found." />
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-4 font-semibold text-neutral-950">#{order.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-neutral-900">{order.customer_name || 'Guest'}</p>
                      <p className="text-xs text-neutral-500">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-4 text-neutral-700">{order.item_count ?? '-'}</td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        disabled={isUpdating}
                        onChange={(event) => handleStatusChange(order.id, event.target.value)}
                        className={`rounded-md border-0 px-2 py-1 text-xs font-semibold capitalize outline-none focus:ring-2 focus:ring-indigo-500 ${statusStyles[order.status] || 'bg-neutral-100 text-neutral-700'}`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(order)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
                        aria-label={`View order ${order.id}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(selectedOrder || isDetailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4">
          <div className={`${cardClass} w-full max-w-lg`}>
            <div className="flex items-center justify-between border-b border-neutral-200 p-5">
              <div>
                <h3 className="text-lg font-bold text-neutral-950">
                  Order #{selectedOrder?.id || '...'}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">Order details and line items</p>
              </div>
              <button type="button" onClick={closeDetail} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {isDetailLoading ? (
              <div className="flex items-center justify-center py-16 text-neutral-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Loading order...
              </div>
            ) : selectedOrder && (
              <div className="p-5">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Customer</span>
                    <span className="font-medium text-neutral-900">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email</span>
                    <span className="font-medium text-neutral-900">{selectedOrder.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusStyles[selectedOrder.status]}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-bold text-neutral-950">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <h4 className="text-sm font-semibold text-neutral-800">Line items</h4>
                  <ul className="mt-3 space-y-3">
                    {(selectedOrder.items || []).length === 0 ? (
                      <li className="text-sm text-neutral-500">No line items.</li>
                    ) : (
                      selectedOrder.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium text-neutral-900">{item.product_name}</p>
                            <p className="text-xs text-neutral-500">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                          </div>
                          <p className="font-semibold text-neutral-800">
                            {formatCurrency(Number(item.price) * Number(item.quantity))}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
