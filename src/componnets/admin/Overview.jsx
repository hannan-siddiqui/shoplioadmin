import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { dashboardApi } from '../../lib/api'
import {
  EmptyRow,
  LoadingRow,
  MessageBanner,
  PageHeader,
  btnSecondary,
  cardClass,
  formatCurrency,
  statusStyles,
} from './shared'

const StatCard = ({ label, value, icon: Icon, accent = 'text-indigo-600' }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-neutral-500">{label}</p>
      <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
    </div>
    <p className="mt-3 text-3xl font-bold text-neutral-950">{value}</p>
  </div>
)

const Overview = () => {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadOverview = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const [statsRes, revenueRes, ordersRes, productsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRevenue(),
        dashboardApi.getRecentOrders(8),
        dashboardApi.getTopProducts(5),
      ])

      setStats(statsRes.data?.data || null)
      setRevenue(revenueRes.data?.data || [])
      setRecentOrders(ordersRes.data?.data || [])
      setTopProducts(productsRes.data?.data || [])
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Could not load dashboard data.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  return (
    <div>
      <PageHeader
        title="Dashboard overview"
        description="Real-time store performance and activity."
        action={
          <button type="button" onClick={loadOverview} className={btnSecondary}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        }
      />

      {message && <div className="mb-5"><MessageBanner message={message} /></div>}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-neutral-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total revenue" value={formatCurrency(stats?.totalRevenue)} icon={DollarSign} accent="text-emerald-600" />
            <StatCard label="Total orders" value={stats?.totalOrders ?? 0} icon={Truck} />
            <StatCard label="Products" value={stats?.totalProducts ?? 0} icon={Package} />
            <StatCard label="Customers" value={stats?.totalUsers ?? 0} icon={Users} accent="text-violet-600" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Pending orders" value={stats?.pendingOrders ?? 0} icon={Truck} accent="text-amber-600" />
            <StatCard label="Inventory value" value={formatCurrency(stats?.inventoryValue)} icon={TrendingUp} accent="text-emerald-600" />
            <StatCard label="Low stock items" value={stats?.lowStockCount ?? 0} icon={Package} accent="text-red-600" />
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className={`${cardClass} p-5`}>
              <h3 className="text-lg font-bold text-neutral-950">Revenue (last 12 months)</h3>
              <p className="mt-1 text-sm text-neutral-500">Monthly revenue from non-cancelled orders</p>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className={`${cardClass} overflow-hidden`}>
              <div className="border-b border-neutral-200 p-5">
                <h3 className="text-lg font-bold text-neutral-950">Top products</h3>
                <p className="mt-1 text-sm text-neutral-500">Best sellers by units sold</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                  <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                    <tr>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Sold</th>
                      <th className="px-5 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {topProducts.length === 0 ? (
                      <EmptyRow colSpan={3} label="No sales data yet." />
                    ) : (
                      topProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-neutral-50">
                          <td className="px-5 py-4 font-semibold text-neutral-950">{product.name}</td>
                          <td className="px-5 py-4 text-neutral-700">{product.total_sold}</td>
                          <td className="px-5 py-4 font-semibold text-neutral-800">
                            {formatCurrency(product.total_revenue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className={`${cardClass} mt-6 overflow-hidden`}>
            <div className="border-b border-neutral-200 p-5">
              <h3 className="text-lg font-bold text-neutral-950">Recent orders</h3>
              <p className="mt-1 text-sm text-neutral-500">Latest customer orders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white">
                  {recentOrders.length === 0 ? (
                    <EmptyRow colSpan={5} label="No orders yet." />
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50">
                        <td className="px-5 py-4 font-semibold text-neutral-950">#{order.id}</td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-neutral-900">{order.customer_name || 'Guest'}</p>
                          <p className="text-xs text-neutral-500">{order.customer_email}</p>
                        </td>
                        <td className="px-5 py-4 font-semibold">{formatCurrency(order.total)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusStyles[order.status] || 'bg-neutral-100 text-neutral-700'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Overview
