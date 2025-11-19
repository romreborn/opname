import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'
import toast, { Toaster } from 'react-hot-toast'

interface AssetWithOpname {
  id: string
  name: string
  merk: string | null
  tahun: number | null
  no_asset: string | null
  pemakai: string | null
  site: string | null
  lokasi: string | null
  opname_records: {
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
  }[] | null
}

export default function Report() {
  const [assets, setAssets] = useState<AssetWithOpname[]>([])
  const [filteredAssets, setFilteredAssets] = useState<AssetWithOpname[]>([])
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    merk: '',
    tahun: '',
    pemakai: '',
    site: '',
    lokasi: '',
    statusOpname: '', // 'sudah', 'belum', or ''
    keterangan: '', // 'ada', 'tidak_ada', or ''
    statusAktiva: '' // 'bagus', 'rusak', or ''
  })

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof AssetWithOpname) => {
    const values = assets.map(asset => asset[field]).filter(Boolean)
    return [...new Set(values)] as string[]
  }

  const getUniqueTahun = () => {
    const values = assets.map(asset => asset.tahun).filter(Boolean)
    return [...new Set(values)].sort((a, b) => (b || 0) - (a || 0)) as number[]
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        opname_records (
          id,
          asset_id,
          keterangan_ada,
          keterangan_tidak_ada,
          status_bagus,
          status_rusak,
          h_perolehan,
          nilai_buku,
          image_url,
          created_at
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching assets:', error)
    } else {
      setAssets(data || [])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...assets]

    // Text filters
    if (filters.merk) {
      filtered = filtered.filter(asset =>
        asset.merk?.toLowerCase().includes(filters.merk.toLowerCase())
      )
    }

    if (filters.tahun) {
      filtered = filtered.filter(asset =>
        asset.tahun?.toString() === filters.tahun
      )
    }

    if (filters.pemakai) {
      filtered = filtered.filter(asset =>
        asset.pemakai?.toLowerCase().includes(filters.pemakai.toLowerCase())
      )
    }

    if (filters.site) {
      filtered = filtered.filter(asset =>
        asset.site?.toLowerCase().includes(filters.site.toLowerCase())
      )
    }

    if (filters.lokasi) {
      filtered = filtered.filter(asset =>
        asset.lokasi?.toLowerCase().includes(filters.lokasi.toLowerCase())
      )
    }

    // Opname status filter
    if (filters.statusOpname === 'sudah') {
      filtered = filtered.filter(asset =>
        asset.opname_records && asset.opname_records.length > 0
      )
    } else if (filters.statusOpname === 'belum') {
      filtered = filtered.filter(asset =>
        !asset.opname_records || asset.opname_records.length === 0
      )
    }

    // Keterangan filter
    if (filters.keterangan === 'ada') {
      filtered = filtered.filter(asset =>
        asset.opname_records && asset.opname_records[0]?.keterangan_ada
      )
    } else if (filters.keterangan === 'tidak_ada') {
      filtered = filtered.filter(asset =>
        asset.opname_records && asset.opname_records[0]?.keterangan_tidak_ada
      )
    }

    // Status aktiva filter
    if (filters.statusAktiva === 'bagus') {
      filtered = filtered.filter(asset =>
        asset.opname_records && asset.opname_records[0]?.status_bagus
      )
    } else if (filters.statusAktiva === 'rusak') {
      filtered = filtered.filter(asset =>
        asset.opname_records && asset.opname_records[0]?.status_rusak
      )
    }

    setFilteredAssets(filtered)
    setShowReport(true)
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleShowReport = () => {
    applyFilters()
  }

  const handleResetFilters = () => {
    setFilters({
      merk: '',
      tahun: '',
      pemakai: '',
      site: '',
      lokasi: '',
      statusOpname: '',
      keterangan: '',
      statusAktiva: ''
    })
    setFilteredAssets(assets)
    setShowReport(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      toast.loading('Generating Excel report with images...', { id: 'export-excel' })

      // Use filtered assets if report is shown, otherwise use all assets
      const dataToExport = showReport ? filteredAssets : assets

      // Prepare data for Excel
      const excelData = dataToExport.map((asset, index) => {
        const opname = asset.opname_records && asset.opname_records.length > 0 ? asset.opname_records[0] : null

        return {
          'No': index + 1,
          'Nama Asset': asset.name || '-',
          'Merk': asset.merk || '-',
          'Tahun': asset.tahun || '-',
          'No. Asset': asset.no_asset || '-',
          'Pemakai': asset.pemakai || '-',
          'Site': asset.site || '-',
          'Lokasi': asset.lokasi || '-',
          'Status Opname': opname ? 'Sudah' : 'Belum',
          'Keterangan Ada': opname?.keterangan_ada ? '✓ ADA' : '',
          'Keterangan Tidak Ada': opname?.keterangan_tidak_ada ? '✓ TIDAK ADA' : '',
          'Status Bagus': opname?.status_bagus ? '✓ BAGUS' : '',
          'Status Rusak': opname?.status_rusak ? '✓ RUSAK' : '',
          'H. Perolehan': opname?.h_perolehan ? `Rp ${Number(opname.h_perolehan).toLocaleString('id-ID')}` : '-',
          'Nilai Buku': opname?.nilai_buku ? `Rp ${Number(opname.nilai_buku).toLocaleString('id-ID')}` : '-',
          'Image Status': opname?.image_url ? 'Image Available' : 'No Image',
          'Image URL': opname?.image_url || '',
          'Tanggal Opname': opname?.created_at ? new Date(opname.created_at).toLocaleDateString('id-ID') : '-'
        }
      })

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Create main worksheet with data
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No
        { wch: 30 },  // Nama Asset
        { wch: 15 },  // Merk
        { wch: 8 },   // Tahun
        { wch: 15 },  // No. Asset
        { wch: 20 },  // Pemakai
        { wch: 15 },  // Site
        { wch: 20 },  // Lokasi
        { wch: 12 },  // Status Opname
        { wch: 15 },  // Keterangan Ada
        { wch: 20 },  // Keterangan Tidak Ada
        { wch: 12 },  // Status Bagus
        { wch: 12 },  // Status Rusak
        { wch: 20 },  // H. Perolehan
        { wch: 20 },  // Nilai Buku
        { wch: 15 },  // Image Status
        { wch: 60 },  // Image URL (longer for full URLs)
        { wch: 15 }   // Tanggal Opname
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Opname')

      // Create image reference worksheet
      const imageWs = XLSX.utils.aoa_to_sheet([['Asset Images Reference']])

      // Add headers for image reference
      XLSX.utils.sheet_add_aoa(imageWs, [
        ['No', 'Nama Asset', 'Image URL', 'Notes'],
        ...dataToExport.map((asset, index) => {
          const opname = asset.opname_records && asset.opname_records.length > 0 ? asset.opname_records[0] : null
          return [
            index + 1,
            asset.name || '-',
            opname?.image_url || '',
            opname?.image_url ? 'Click link to view image in browser' : 'No image uploaded'
          ]
        })
      ], { origin: 'A2' })

      // Set column widths for image worksheet
      imageWs['!cols'] = [
        { wch: 5 },   // No
        { wch: 30 },  // Nama Asset
        { wch: 80 },  // Image URL (extra wide)
        { wch: 30 }   // Notes
      ]

      // Add image worksheet to workbook
      XLSX.utils.book_append_sheet(wb, imageWs, 'Image References')

      // Generate filename with timestamp and filter info
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filterSuffix = showReport ? `_Filtered_${dataToExport.length}records` : ''
      const fileName = `Laporan_Opname_Asset_${timestamp}${filterSuffix}.xlsx`

      // Write file
      XLSX.writeFile(wb, fileName)

      toast.success('Excel report with image references generated successfully!', { id: 'export-excel' })
    } catch (error) {
      console.error('Error generating Excel:', error)
      toast.error('Failed to generate Excel report', { id: 'export-excel' })
    }
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
              <p className="text-gray-600 mt-2">Filter dan tampilkan laporan asset opname</p>
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
              <button
                onClick={handleExportExcel}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Laporan</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {/* Merk Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merk</label>
                <input
                  type="text"
                  value={filters.merk}
                  onChange={(e) => handleFilterChange('merk', e.target.value)}
                  placeholder="Filter berdasarkan merk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tahun Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                <select
                  value={filters.tahun}
                  onChange={(e) => handleFilterChange('tahun', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Tahun</option>
                  {getUniqueTahun().map(tahun => (
                    <option key={tahun} value={tahun.toString()}>{tahun}</option>
                  ))}
                </select>
              </div>

              {/* Pemakai Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pemakai</label>
                <input
                  type="text"
                  value={filters.pemakai}
                  onChange={(e) => handleFilterChange('pemakai', e.target.value)}
                  placeholder="Filter berdasarkan pemakai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Site Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <input
                  type="text"
                  value={filters.site}
                  onChange={(e) => handleFilterChange('site', e.target.value)}
                  placeholder="Filter berdasarkan site"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lokasi Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={filters.lokasi}
                  onChange={(e) => handleFilterChange('lokasi', e.target.value)}
                  placeholder="Filter berdasarkan lokasi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Opname Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Opname</label>
                <select
                  value={filters.statusOpname}
                  onChange={(e) => handleFilterChange('statusOpname', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="sudah">Sudah Diopname</option>
                  <option value="belum">Belum Diopname</option>
                </select>
              </div>

              {/* Keterangan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <select
                  value={filters.keterangan}
                  onChange={(e) => handleFilterChange('keterangan', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Keterangan</option>
                  <option value="ada">ADA</option>
                  <option value="tidak_ada">TIDAK ADA</option>
                </select>
              </div>

              {/* Status Aktiva Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Aktiva</label>
                <select
                  value={filters.statusAktiva}
                  onChange={(e) => handleFilterChange('statusAktiva', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="bagus">BAGUS</option>
                  <option value="rusak">RUSAK</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShowReport}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tampilkan Laporan
              </button>

              {showReport && (
                <button
                  onClick={handleResetFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filter
                </button>
              )}
            </div>

            {showReport && (
              <div className="mt-4 text-sm text-gray-600">
                Menampilkan {filteredAssets.length} dari {assets.length} asset
                {filters.merk && ` (merk: "${filters.merk}")`}
                {filters.tahun && ` (tahun: ${filters.tahun})`}
                {filters.pemakai && ` (pemakai: "${filters.pemakai}")`}
                {filters.site && ` (site: "${filters.site}")`}
                {filters.lokasi && ` (lokasi: "${filters.lokasi}")`}
                {filters.statusOpname && ` (status opname: ${filters.statusOpname})`}
                {filters.keterangan && ` (keterangan: ${filters.keterangan})`}
                {filters.statusAktiva && ` (status aktiva: ${filters.statusAktiva})`}
              </div>
            )}
          </div>

          {/* Statistics Cards - Only show when report is displayed */}
          {showReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Asset (Filtered)</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredAssets.length}</p>
                  <p className="text-xs text-gray-500">dari {assets.length} total</p>
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
                  <p className="text-sm font-medium text-green-800">Sudah Diopname</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredAssets.filter(a => a.opname_records && a.opname_records.length > 0).length}
                  </p>
                  <p className="text-xs text-green-600">
                    {filteredAssets.length > 0 ? Math.round((filteredAssets.filter(a => a.opname_records && a.opname_records.length > 0).length / filteredAssets.length) * 100) : 0}%
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
                    {filteredAssets.filter(a => a.opname_records && a.opname_records.some(r => r.status_bagus)).length}
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
                    Rp {filteredAssets.filter(a => a.opname_records && a.opname_records.length > 0).reduce((sum, a) => sum + (a.opname_records![0]?.h_perolehan || 0), 0).toLocaleString('id-ID')}
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
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-xl font-semibold text-gray-600">Loading...</div>
            </div>
          ) : !showReport ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Silahkan Pilih Filter dan Tampilkan Laporan</h3>
              <p className="text-gray-600 mb-6">Gunakan filter di atas untuk menyaring data asset yang ingin ditampilkan</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data yang cocok dengan filter</h3>
              <p className="text-gray-600 mb-6">Coba ubah filter atau reset untuk menampilkan semua data</p>
              <button
                onClick={handleResetFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filter
              </button>
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
                    <th rowSpan={2} className="border border-gray-300 px-4 py-2 text-center font-semibold">Status Opname</th>
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
                  {filteredAssets.map((asset, idx) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-gray-300 px-4 py-2">{asset.name || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{asset.merk || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{asset.tahun || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{asset.no_asset || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{asset.pemakai || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{asset.site || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{asset.lokasi || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Sudah
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records[0]?.keterangan_ada && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ ADA
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records[0]?.keterangan_tidak_ada && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ✓ TIDAK ADA
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records[0]?.status_bagus && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ BAGUS
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records[0]?.status_rusak && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ✓ RUSAK
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {asset.opname_records && asset.opname_records[0]?.h_perolehan ? `Rp ${Number(asset.opname_records[0].h_perolehan).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                        {asset.opname_records && asset.opname_records[0]?.nilai_buku ? `Rp ${Number(asset.opname_records[0].nilai_buku).toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {asset.opname_records && asset.opname_records[0]?.image_url ? (
                          <div className="relative inline-block">
                            <img
                              src={asset.opname_records[0].image_url}
                              alt="Asset"
                              className="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => asset.opname_records && asset.opname_records[0]?.image_url && window.open(asset.opname_records[0].image_url, '_blank')}
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
                    <td colSpan={12} className="border border-gray-300 px-4 py-2 text-right">TOTAL:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {assets.filter(a => a.opname_records && a.opname_records.length > 0).reduce((sum, a) => sum + (a.opname_records![0]?.h_perolehan || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rp {assets.filter(a => a.opname_records && a.opname_records.length > 0).reduce((sum, a) => sum + (a.opname_records![0]?.nilai_buku || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-gray-300 px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Footer */}
          {showReport && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Menampilkan {filteredAssets.length} dari {assets.length} asset ({filteredAssets.filter(a => a.opname_records && a.opname_records.length > 0).length} sudah diopname)</p>
              <p className="mt-1">
                Generated on {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
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