import { AlertCircle, Loader2 } from 'lucide-react'

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export const formatCurrency = (value) => currency.format(Number(value || 0))

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
}

export const MessageBanner = ({ message }) => {
  if (!message) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
        message.type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message.text}
    </div>
  )
}

export const LoadingRow = ({ colSpan, label = 'Loading...' }) => (
  <tr>
    <td colSpan={colSpan} className="px-5 py-10 text-center text-neutral-500">
      <span className="inline-flex items-center gap-2 font-medium">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </td>
  </tr>
)

export const EmptyRow = ({ colSpan, label = 'No records found.' }) => (
  <tr>
    <td colSpan={colSpan} className="px-5 py-10 text-center text-neutral-500">
      {label}
    </td>
  </tr>
)

export const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold text-neutral-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </div>
    {action}
  </div>
)

export const inputClass =
  'h-11 w-full rounded-md border border-neutral-300 px-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export const textareaClass =
  'w-full resize-none rounded-md border border-neutral-300 px-3 py-3 text-sm font-medium outline-none transition placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export const btnPrimary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-500'

export const btnSecondary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'

export const cardClass = 'rounded-lg border border-neutral-200 bg-white shadow-sm'
