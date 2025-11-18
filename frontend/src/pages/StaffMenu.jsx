import { useEffect, useState } from 'react'
import { useApi } from '../api/client.js'

function Modal({ children, onClose, dark = false }) {
  const innerStyle = dark
    ? { background: '#0b1220', color: '#e6eef8', borderRadius: 10, padding: 20, width: '90%', maxWidth: 450, boxShadow: '0 8px 30px rgba(2,6,23,0.6)' }
    : { background: 'white', color: '#000', borderRadius: 10, padding: 20, width: '90%', maxWidth: 450 }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={onClose}>
      <div style={innerStyle} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export default function StaffMenu() {
  const api = useApi()
  const [menu, setMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('eazyeats')
  const [item, setItem] = useState({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 0, isAvailable: true })
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [file, setFile] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/menu')
      setMenu(res.data.menu)
    } catch (e) {
      setError('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const createActiveMenu = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/menu', { title: 'eazyeats' })
      setMenu(res.data.menu)
      setTitle('eazyeats')
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create menu')
    } finally {
      setSaving(false)
    }
  }

  const addItem = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...item, price: Number(item.price), stock: Number(item.stock) }
      await api.post('/menu/items', payload)
      setItem({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 0, isAvailable: true })
      await load()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const updateItem = async (id, patch) => {
    try {
      await api.patch(`/menu/items/${id}`, patch)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || 'Update failed')
    }
  }

  const toggleAvailability = async (id, isAvailable) => updateItem(id, { isAvailable })

  const deleteItem = async (id) => {
    try {
      await api.delete(`/menu/items/${id}`)
      setShowDeleteModal(false)
      setItemToDelete(null)
      await load()
    } catch (e) {
      alert(e.response?.data?.error || 'Delete failed')
    }
  }

  const startEdit = (it) => {
    setEditingItem(it)
    setItem({
      name: it.name,
      price: it.price,
      description: it.description || '',
      category: it.category || '',
      imageUrl: it.imageUrl || '',
      stock: it.stock || 0,
      isAvailable: it.isAvailable
    })
    setShowModal(true)
  }

  return (
    <section className="section">
      
      {error && <div style={{ color: 'salmon' }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {!menu ? (
            <form onSubmit={createActiveMenu} className="form" style={{ marginBottom: 20 }}>
              <h3>Create Menu</h3>
              <div className="row" style={{ alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 14 }}>Title: <strong>eazyeats</strong></div>
                <button className="btn" type="submit" disabled={saving}>Create</button>
              </div>
            </form>
          ) : (

        
            <>
              <div style={{ marginBottom: 12 }}>
                <button className="btn" onClick={() => setShowModal(true)}>Add Menu Item</button>
              </div>

              {showDeleteModal && itemToDelete && (
                <Modal dark onClose={() => { setShowDeleteModal(false); setItemToDelete(null) }}>
                  <h3 style={{ marginTop: 0, marginBottom: 16 }}></h3>
                  <p style={{ marginBottom: 20, color: 'rgba(246, 247, 248, 0.9)' }}>Are you sure you want to delete this item.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline "  style={{ color: 'rgba(246, 247, 248, 0.9)' }} onClick={() => { setShowDeleteModal(false); setItemToDelete(null) }}>Cancel</button>
                    <button type="button" className="btn" style={{ background: 'crimson', color: 'rgba(246, 247, 248, 0.9)' }} onClick={() => deleteItem(itemToDelete._id)}>Delete</button>
                  </div>
                </Modal>
              )}

              {showModal && (
                <Modal onClose={() => { setShowModal(false); setEditingItem(null); setItem({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 0, isAvailable: true }); setFile(null) }}>
                  <div style={{ maxWidth: 450, width: '100%' }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 22, fontWeight: 700 }}>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      setSaving(true)
                      setError('')
                      try {
                        let imageUrl = item.imageUrl
                        if (file) {
                          const fd = new FormData()
                          fd.append('image', file)
                          const up = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                          imageUrl = up.data.url
                        }
                        const payload = { ...item, price: Number(item.price), stock: Number(item.stock), imageUrl }
                        if (editingItem) {
                          await api.patch(`/menu/items/${editingItem._id}`, payload)
                        } else {
                          await api.post('/menu/items', payload)
                        }
                        setItem({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 0, isAvailable: true })
                        setFile(null)
                        setShowModal(false)
                        await load()
                      } catch (e) {
                        setError(e.response?.data?.error || 'Failed to save item')
                      } finally {
                        setSaving(false)
                      }
                    }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      
                      {/* Image Upload Card */}
                      <div style={{ marginBottom: 4 }}>
                        <label style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 8, display: 'block' }}>Item Image</label>
                        <div style={{ 
                          border: '2px dashed #d1d5db', 
                          borderRadius: 8, 
                          padding: 16,
                          textAlign: 'center',
                          background: '#f9fafb',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => document.getElementById('imageInput').click()}
                        >
                          {(file || item.imageUrl) ? (
                            <div style={{ position: 'relative' }}>
                              <img 
                                src={file ? URL.createObjectURL(file) : item.imageUrl} 
                                alt="Preview" 
                                style={{ 
                                  maxWidth: '100%', 
                                  maxHeight: 180, 
                                  borderRadius: 8,
                                  objectFit: 'cover'
                                }} 
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFile(null)
                                  setItem({ ...item, imageUrl: '' })
                                }}
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  background: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div>
                              <svg style={{ width: 40, height: 40, margin: '0 auto 10px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Click to upload image</p>
                              <p style={{ color: '#9ca3af', fontSize: 11, margin: '4px 0 0 0' }}>PNG, JPG up to 10MB</p>
                            </div>
                          )}
                          <input 
                            id="imageInput"
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setFile(e.target.files[0])} 
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>Name</span>
                          <input 
                            placeholder="Item name" 
                            value={item.name} 
                            onChange={(e) => setItem({ ...item, name: e.target.value })} 
                            required 
                            style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#ffff', color: '#000', fontSize: 14 }}
                          />
                        </label>
                        <label style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>Price</span>
                          <input 
                            placeholder="Price" 
                            type="number" 
                            step="0.01" 
                            value={item.price} 
                            onChange={(e) => setItem({ ...item, price: e.target.value })} 
                            required 
                            style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#ffff', color: '#000', fontSize: 14 }}
                          />
                        </label>
                      </div>

                      <label style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>Description</span>
                        <textarea 
                          placeholder="Item description" 
                          value={item.description} 
                          onChange={(e) => setItem({ ...item, description: e.target.value })} 
                          rows={3}
                          style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#ffff', color: '#000', resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
                        />
                      </label>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 6 }}>Category</span>
                          <input 
                            placeholder="e.g., Appetizer, Main" 
                            value={item.category} 
                            onChange={(e) => setItem({ ...item, category: e.target.value })} 
                            style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#ffff', color: '#000', fontSize: 14 }}
                          />
                        </label>
                        
                      </div>

                      <div>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 8, display: 'block' }}>Availability</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setItem({ ...item, isAvailable: true })}
                            style={{
                              flex: 1,
                              padding: '9px 14px',
                              borderRadius: 6,
                              border: item.isAvailable ? '2px solid #10b981' : '1px solid #d1d5db',
                              background: item.isAvailable ? 'rgba(16, 185, 129, 0.1)' : '#f9fafb',
                              color: item.isAvailable ? '#10b981' : '#374151',
                              fontWeight: item.isAvailable ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: 14
                            }}
                          >
                            ✓ Available
                          </button>
                          <button
                            type="button"
                            onClick={() => setItem({ ...item, isAvailable: false })}
                            style={{
                              flex: 1,
                              padding: '9px 14px',
                              borderRadius: 6,
                              border: !item.isAvailable ? '2px solid #ef4444' : '1px solid #d1d5db',
                              background: !item.isAvailable ? 'rgba(239, 68, 68, 0.1)' : '#f9fafb',
                              color: !item.isAvailable ? '#ef4444' : '#374151',
                              fontWeight: !item.isAvailable ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: 14
                            }}
                          >
                            ✕ Unavailable
                          </button>
                        </div>
                      </div>

                      {error && <div style={{ color: 'salmon', fontSize: 13 }}>{error}</div>}

                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button 
                          className="btn" 
                          type="submit" 
                          disabled={saving}
                          style={{ flex: 1, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}
                        >
                          {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => { setShowModal(false); setEditingItem(null); setItem({ name: '', price: '', description: '', category: '', imageUrl: '', stock: 0, isAvailable: true }); setFile(null) }}
                          style={{ flex: 1, padding: '10px 14px', fontSize: 14, fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </Modal>
              )}

            
              <div className="grid-layout">
                {(menu.items || []).map((it) => (
                  <div key={it._id} className="card">
                    <div className="card-image" style={{ backgroundImage: `url(${it.imageUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'})` }} />
                    <div className="card-body">
                      <div className="card-title">{it.name}</div>
                      <div className="price">₹{Number(it.price).toFixed(2)}</div>
                      <div className="row" style={{ marginBottom: 8 }}>
                        <button
                          onClick={() => toggleAvailability(it._id, !it.isAvailable)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            // Use action-based colors: when item is available the action is to make it unavailable (red).
                            border: it.isAvailable ? '1px solid rgba(239,68,68,0.22)' : '1px solid rgba(16,185,129,0.22)',
                            background: it.isAvailable ? 'rgb(237, 220, 220)' : 'rgb(212, 240, 231)',
                            color: it.isAvailable ? '#7f1d1d' : '#064e3b',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontSize: 14
                          }}
                        >
                          {it.isAvailable ? 'Set Unavailable' : 'Set Available'}
                        </button>
                        <button 
                          className="btn-outline" 
                          onClick={() => {
                            setItem({
                              name: it.name,
                              price: it.price,
                              description: it.description || '',
                              category: it.category || '',
                              imageUrl: it.imageUrl || '',
                              stock: it.stock || 0,
                              isAvailable: it.isAvailable
                            });
                            setEditingItem(it);
                            setShowModal(true);
                          }}
                          style={{ color: '#2563eb', borderColor: 'rgba(37,99,235,0.15)' }}
                        >
                          Edit
                        </button>
                        <button className="btn-outline" onClick={() => { setItemToDelete(it); setShowDeleteModal(true) }} style={{ color: 'crimson', borderColor: 'rgba(255,0,0,0.15)' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
