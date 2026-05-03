import toast from 'react-hot-toast'

interface ToastOptions {
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const toaster = {
  create: ({ title, description, type, duration }: ToastOptions) => {
    const msg = description ? `${title} — ${description}` : title
    const opts = duration ? { duration } : {}
    if (type === 'success') toast.success(msg, opts)
    else if (type === 'error') toast.error(msg, opts)
    else toast(msg, opts)
  },
}
