import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import toast, { Toaster } from 'react-hot-toast'

interface Asset {
  id: string
  name: string
  merk: string | null
  tahun: number | null
  no_asset: string | null
  pemakai: string | null
  site: string | null
  lokasi: string | null
}

interface OpnameRecord {
  id: string
  asset_id: string
  keterangan_ada: boolean
  keterangan_tidak_ada: boolean
  status_bagus: boolean
  status_rusak: boolean
  h_perolehan: number | null
  nilai_buku: number | null
  image_url: string | null
  created_at: string
  assets: Asset
}

export default function Delete() {
  const [opnameRecords, setOpnameRecords] = useState<OpnameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<OpnameRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchOpnameRecords()
  }, [])

  const fetchOpnameRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('opname_records')
        .select(`
          *,
          assets (
            id,
            name,
            merk,
            tahun,
            no_asset,
            pemakai,
            site,
            lokasi
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOpnameRecords(data as OpnameRecord[])
    } catch (error) {
      console.error('Error fetching opname records:', error)
      toast.error('Gagal memuat data opname')
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = opnameRecords.filter(record => {
    const query = searchQuery.toLowerCase()
    return (
      record.assets.name.toLowerCase().includes(query) ||
      record.assets.merk?.toLowerCase().includes(query) ||
      record.assets.no_asset?.toLowerCase().includes(query) ||
      record.assets.pemakai?.toLowerCase().includes(query) ||
      record.assets.site?.toLowerCase().includes(query) ||
      record.assets.lokasi?.toLowerCase().includes(query)
    )
  })

  const handleDelete = async () => {
    if (!selectedRecord) return

    setIsDeleting(true)
    try {
      // Delete image from storage if exists
      if (selectedRecord.image_url) {
        const imagePath = selectedRecord.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('opname-images')
            .remove([imagePath])
        }
      }

      // Delete opname record from database
      const { error } = await supabase
        .from('opname_records')
        .delete()
        .eq('id', selectedRecord.id)

      if (error) throw error

      toast.success(`Data opname untuk "${selectedRecord.assets.name}" berhasil dihapus!`, {
        duration: 4000,
        icon: '🗑️',
      })

      // Refresh data and reset form
      fetchOpnameRecords()
      setSelectedRecord(null)
      setConfirmDelete(false)
    } catch (error) {
      console.error('Error deleting opname record:', error)
      toast.error('Gagal menghapus data opname')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusText = (record: OpnameRecord) => {
    if (record.keterangan_ada) return 'ADA'
    if (record.keterangan_tidak_ada) return 'TIDAK ADA'
    return '-'
  }

  const getStatusColor = (record: OpnameRecord) => {
    if (record.keterangan_ada) return 'text-green-700 bg-green-50'
    if (record.keterangan_tidak_ada) return 'text-red-700 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getAktivaStatus = (record: OpnameRecord) => {
    if (record.status_bagus) return 'BAGUS'
    if (record.status_rusak) return 'RUSAK'
    return '-'
  }

  const getAktivaStatusColor = (record: OpnameRecord) => {
    if (record.status_bagus) return 'text-green-700 bg-green-50'
    if (record.status_rusak) return 'text-orange-700 bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data opname...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-red-600 hover:text-red-800 flex items-center">
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hapus Data Opname</h1>
            <p className="text-gray-600 mt-2">Hapus data opname yang sudah ada untuk revisi ulang</p>
          </div>

          {/* Search Box */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama asset, merk, no asset, pemakai, site, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 font-medium">Total Data Opname</div>
              <div className="text-2xl font-bold text-red-900">{opnameRecords.length}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Ditemukan</div>
              <div className="text-2xl font-bold text-blue-900">{filteredRecords.length}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Bisa Di Revisi</div>
              <div className="text-2xl font-bold text-green-900">{filteredRecords.length}</div>
            </div>
          </div>

          {/* Data Table */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Tidak ada data opname yang ditemukan' : 'Belum ada data opname'}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Coba kata kunci pencarian lainnya'
                  : 'Data opname akan muncul di sini setelah ada input data'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Nama Asset</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Merk</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Tahun</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">No. Asset</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Pemakai</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Kondisi</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">H. Perolehan</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Nilai Buku</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{record.assets.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{record.assets.merk || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{record.assets.tahun || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{record.assets.no_asset || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{record.assets.pemakai || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record)}`}>
                          {getStatusText(record)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAktivaStatusColor(record)}`}>
                          {getAktivaStatus(record)}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(record.h_perolehan)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(record.nilai_buku)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedRecord(record)
                            setConfirmDelete(true)
                          }}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
                  <p className="text-sm text-gray-600">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Apakah Anda yakin ingin menghapus data opname untuk:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-gray-900">{selectedRecord.assets.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedRecord.assets.merk && `${selectedRecord.assets.merk} • `}
                    {selectedRecord.assets.tahun && `${selectedRecord.assets.tahun} • `}
                    {selectedRecord.assets.no_asset && `${selectedRecord.assets.no_asset}`}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Status: {getStatusText(selectedRecord)} • Kondisi: {getAktivaStatus(selectedRecord)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Dibuat: {new Date(selectedRecord.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Setelah dihapus, data ini bisa di-input kembali melalui halaman Input Data Opname.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmDelete(false)
                    setSelectedRecord(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}