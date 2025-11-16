import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'

export default function AdminDashboard() {
  const api = useApi()
  const [metrics, setMetrics] = useState(null)
  const [title, setTitle] = useState('')
  const [item, setItem] = useState({ name: '', price: 0, description: '' })
  const [message, setMessage] = useState('')

  const load = async () => {
    const res = await api.get('/admin/metrics')
    setMetrics(res.data)
  }

  useEffect(() => { load() }, [])

  const createMenu = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/menu', { title })
      setTitle('')
      setMessage('New active menu created')
    } catch (e) {
      setMessage(e.response?.data?.error || 'Failed to create menu')
    }
  }

  const addItem = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/menu/items', { ...item, price: Number(item.price) })
      setItem({ name: '', price: 0, description: '' })
      setMessage('Item added to active menu')
    } catch (e) {
      setMessage(e.response?.data?.error || 'Failed to add item')
    }
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {metrics ? (
        <div style={{ marginBottom: 12 }}>
          <div>Total Orders: {metrics.totalOrders}</div>
          <div>Today Orders: {metrics.todayOrders}</div>
          <div>By Status: {Object.entries(metrics.byStatus).map(([k,v]) => `${k}:${v}`).join(' | ')}</div>
        </div>
      ) : (
        <div>Loading metrics...</div>
      )}

      <div style={{ display: 'flex', gap: 24 }}>
        <form onSubmit={createMenu} style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3>Create Active Menu</h3>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <button type="submit" style={{ marginLeft: 8 }}>Create</button>
        </form>

        <form onSubmit={addItem} style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3>Add Menu Item</h3>
          <div>
            <input placeholder="Name" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} required />
          </div>
          <div>
            <input placeholder="Price" type="number" step="0.01" value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })} required />
          </div>
          <div>
            <input placeholder="Description" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} />
          </div>
          <button type="submit">Add Item</button>
        </form>
      </div>

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  )
}
