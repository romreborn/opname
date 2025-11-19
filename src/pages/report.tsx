import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

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
  assets: {
    name: string
    merk: string | null
    tahun: number | null
    no_asset: string | null
    pemakai: string | null
    site: string | null
    lokasi: string | null
  }
}

export default function Report() {
  const [records, setRecords] = useState<OpnameRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('opname_records')
      .select(`
        *,
        assets (
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

    if (error) {
      console.error('Error fetching records:', error)
    } else {
      setRecords(data || [])
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-6">
          <Link href="/" className="text-green-600 hover:text-green-800 flex items-center">
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laporan Opname</h1>
              <p className="text-gray-600 mt-2">Daftar seluruh data opname asset yang telah dicatat</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/input">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Input Data
                </button>
              </Link>
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Asset</p>
                  <p className="text-2xl font-bold text-blue-600">{records.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Asset Ada</p>
                  <p className="text-2xl font-bold text-green-600">
                    {records.filter(r => r.keterangan_ada).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Asset Bagus</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {records.filter(r => r.status_bagus).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Total Nilai</p>
                  <p className="text-xl font-bold text-yellow-600">
                    Rp {records.reduce((sum, r) => sum + (r.h_perolehan || 0), 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-xl font-semibold text-gray-600">Loading...</div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data opname</h3>
              <p className="text-gray-600 mb-6">Mulai input data opname untuk melihat laporan di sini</p>
              <Link href="/input">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Mulai Input Data
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">No</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-left font-semibold">Nama</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-left font-semibold">Merk</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Tahun</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">No. Asset</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Pemakai</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Site</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Lokasi</th>
                    <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">KETERANGAN</th>
                    <th colSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">STATUS AKTIVA</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-right font-semibold">H. Perolehan</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-right font-semibold">Nilai Buku</th>
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Gambar</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-center text-green-700 font-semibold">ADA</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-red-700 font-semibold">TIDAK ADA</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-green-700 font-semibold">BAGUS</th>
                    <th className="border border-gray-300 px-4 py-2 text-center text-orange-700 font-semibold">RUSAK</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{r.assets?.name || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{r.assets?.merk || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{r.assets?.tahun || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{r.assets?.no_asset || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{r.assets?.pemakai || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{r.assets?.site || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{r.assets?.lokasi || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {r.keterangan_ada && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ ADA
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {r.keterangan_tidak_ada && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✓ TIDAK ADA
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {r.status_bagus && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ BAGUS
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {r.status_rusak && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ✓ RUSAK
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {r.h_perolehan ? `Rp ${Number(r.h_perolehan).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {r.nilai_buku ? `Rp ${Number(r.nilai_buku).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {r.image_url ? (
                          <div className="relative inline-block">
                            <img
                              src={r.image_url}
                              alt="Asset"
                              className="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => r.image_url && window.open(r.image_url, '_blank')}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={11} className="border border-gray-300 px-4 py-2 text-right">TOTAL:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {records.reduce((sum, r) => sum + (r.h_perolehan || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {records.reduce((sum, r) => sum + (r.nilai_buku || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Menampilkan {records.length} data opname</p>
            <p className="mt-1">
              Generated on {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}