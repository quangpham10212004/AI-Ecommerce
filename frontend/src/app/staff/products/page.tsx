import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '@/lib/api'
import { productIcon, fmtPrice } from '@/lib/utils'
import type { Product } from '@/types'

const ICONS = ['headphones','laptop','monitor','keyboard','mouse','speaker','phone']
const empty = { name: '', category: '', price: '', ai_match: '', image_icon: 'headphones' }

export default function StaffProducts() {
  const qc = useQueryClient()
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products/').then((r) => r.data)
  })
  const [modal, setModal] = useState<{ open: boolean; id?: number; form: typeof empty }>({ open: false, form: empty })

  const openAdd = () => setModal({ open: true, form: empty })
  const openEdit = (p: Product) => setModal({
    open: true,
    id: p.id,
    form: {
      name: p.name,
      category: p.category,
      price: p.price,
      ai_match: String(p.ai_match ?? ''),
      image_icon: p.image_icon ?? 'headphones'
    }
  })
  const close = () => setModal({ open: false, form: empty })

  const save = async () => {
    const body = { ...modal.form, ai_match: modal.form.ai_match ? Number(modal.form.ai_match) : null }
    if (modal.id) {
      await api.put(`/products/${modal.id}/`, body)
    } else {
      await api.post('/products/', body)
    }
    qc.invalidateQueries({ queryKey: ['products'] })
    close()
  }

  const del = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return
    await api.delete(`/products/${id}/`)
    qc.invalidateQueries({ queryKey: ['products'] })
  }

  const f = modal.form
  const set = (k: string, v: string) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }))

  return (
    <div className="p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Quản lý sản phẩm</h1>
          <p className="text-xs text-gray-500 mt-0.5">Xem, thêm, sửa hoặc xóa sản phẩm trong hệ thống</p>
        </div>
        <button onClick={openAdd} id="btn-add-product" className="btn btn-primary text-sm flex items-center gap-1.5">
          <Plus size={14} /> Thêm sản phẩm
        </button>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-500 text-sm py-4">Đang tải...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Tên', 'Danh mục', 'Giá', 'AI Match', ''].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="py-3 px-3">
                    <span className="mr-2">{productIcon(p.image_icon)}</span>
                    <span className="font-semibold text-white">{p.name}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-400">{p.category}</td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">{fmtPrice(p.price)}</td>
                  <td className="py-3 px-3">
                    {p.ai_match ? <span className="badge badge-muted">{p.ai_match}%</span> : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="btn btn-ghost text-xs py-1 px-2 hover:bg-white/[0.05]"
                        title="Sửa"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => del(p.id)}
                        className="btn btn-danger text-xs py-1 px-2"
                        title="Xóa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                    Không có sản phẩm nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-surface border border-white/[0.07] rounded-2xl p-6 w-full max-w-md animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">{modal.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button onClick={close} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tên sản phẩm</label>
                <input
                  id="input-product-name"
                  className="input w-full"
                  value={f.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Danh mục</label>
                  <input
                    id="input-product-category"
                    className="input w-full"
                    value={f.category}
                    onChange={(e) => set('category', e.target.value)}
                    placeholder="Danh mục"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Giá (VND)</label>
                  <input
                    id="input-product-price"
                    className="input w-full"
                    type="number"
                    value={f.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="Giá bán"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">AI Match (%)</label>
                  <input
                    id="input-product-aimatch"
                    className="input w-full"
                    type="number"
                    min="0"
                    max="100"
                    value={f.ai_match}
                    onChange={(e) => set('ai_match', e.target.value)}
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Icon</label>
                  <select
                    id="select-product-icon"
                    className="input w-full"
                    value={f.image_icon}
                    onChange={(e) => set('image_icon', e.target.value)}
                  >
                    {ICONS.map((i) => (
                      <option key={i} value={i}>
                        {productIcon(i)} {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={close} className="btn btn-ghost">Hủy</button>
              <button onClick={save} id="btn-save-product" className="btn btn-primary">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
