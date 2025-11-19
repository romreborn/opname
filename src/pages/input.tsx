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

export default function Input() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    keterangan: '',
    status: '',
    h_perolehan: '',
    nilai_buku: ''
  })
  const [formErrors, setFormErrors] = useState({
    keterangan: '',
    status: '',
    image: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [submittedAssets, setSubmittedAssets] = useState<Set<string>>(new Set())
  const [showPendingModal, setShowPendingModal] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    // Filter assets based on search query - only search after 4+ characters
    if (searchQuery.trim() === '' || searchQuery.length < 4) {
      setFilteredAssets([])
    } else {
      const filtered = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.no_asset?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.merk?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAssets(filtered)
    }
  }, [searchQuery, assets])

  const fetchAssets = async () => {
    const { data: assetsData, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .order('name')

    if (assetsError) {
      console.error('Error fetching assets:', assetsError)
      return
    }

    // Fetch existing opname records to determine which assets are already opnamed
    const { data: opnameData, error: opnameError } = await supabase
      .from('opname_records')
      .select('asset_id')

    if (opnameError) {
      console.error('Error fetching opname records:', opnameError)
    }

    const opnamedAssetIds = new Set(
      (opnameData || []).map(record => record.asset_id)
    )

    setAssets(assetsData || [])
    setFilteredAssets(assetsData || [])
    setSubmittedAssets(opnamedAssetIds)
  }

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    setSelectedAsset(asset || null)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const getPendingAssets = () => {
    return assets
      .filter(asset => !submittedAssets.has(asset.id))
      .slice(0, 10)
  }

  // Currency formatting functions
  const formatCurrency = (value: string) => {
    if (!value || value === '') return ''

    // Remove non-digit characters
    const cleanValue = value.replace(/[^\d]/g, '')

    // Convert to number and format
    const number = parseFloat(cleanValue) || 0
    return number.toLocaleString('id-ID')
  }

  const parseCurrency = (formattedValue: string) => {
    if (!formattedValue || formattedValue === '') return ''

    // Remove non-digit characters
    return formattedValue.replace(/[^\d]/g, '')
  }

  const handleCurrencyChange = (fieldName: 'h_perolehan' | 'nilai_buku', value: string) => {
    // Allow only digits and basic formatting
    const cleanValue = value.replace(/[^\d]/g, '')
    setFormData(prev => ({
      ...prev,
      [fieldName]: cleanValue
    }))
  }

  const selectPendingAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setSearchQuery(asset.name)
    setShowPendingModal(false)
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file) return null

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 10MB')
      return null
    }

    const fileName = `${Date.now()}_${file.name}`
    const { data, error } = await supabase.storage
      .from('opname-images')
      .upload(fileName, file)

    if (error) {
      toast.error('Upload gagal: ' + error.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('opname-images')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  const validateForm = () => {
    const errors = {
      keterangan: '',
      status: '',
      image: ''
    }

    if (!formData.keterangan) {
      errors.keterangan = 'Keterangan (Ada/Tidak Ada) wajib dipilih'
    }

    if (!formData.status) {
      errors.status = 'Status (Bagus/Rusak) wajib dipilih'
    }

    if (!imageFile) {
      errors.image = 'Foto asset wajib diupload'
    }

    setFormErrors(errors)

    // Show toast notifications for validation errors
    if (errors.keterangan) {
      toast.error(errors.keterangan)
    }
    if (errors.status) {
      toast.error(errors.status)
    }
    if (errors.image) {
      toast.error(errors.image)
    }

    return !errors.keterangan && !errors.status && !errors.image
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAsset) {
      toast.error('Silakan pilih asset terlebih dahulu')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('Mengupload data...')

    try {
      // Upload image first
      let imageUrl = ''
      const uploadedUrl = await handleImageUpload(imageFile!)
      if (!uploadedUrl) {
        toast.dismiss(loadingToast)
        toast.error('Upload gagal: Gagal mengupload foto')
        setLoading(false)
        return
      }
      imageUrl = uploadedUrl

      // Convert form data to database format
      const { error } = await supabase.from('opname_records').insert({
        asset_id: selectedAsset.id,
        keterangan_ada: formData.keterangan === 'ada',
        keterangan_tidak_ada: formData.keterangan === 'tidak_ada',
        status_bagus: formData.status === 'bagus',
        status_rusak: formData.status === 'rusak',
        h_perolehan: parseFloat(formData.h_perolehan) || null,
        nilai_buku: parseFloat(formData.nilai_buku) || null,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      })

      toast.dismiss(loadingToast)

      if (error) {
        toast.error('Save failed: ' + error.message)
        console.error('Supabase error:', error)
      } else {
        toast.success(`Data opname untuk "${selectedAsset.name}" berhasil disimpan!`, {
          duration: 4000,
          icon: '✅',
        })

        // Add to submitted assets
        setSubmittedAssets(prev => {
          const newSet = new Set(prev)
          newSet.add(selectedAsset.id)
          return newSet
        })
        // Reset form
        setSelectedAsset(null)
        setImageFile(null)
        setSearchQuery('')
        setFormData({
          keterangan: '',
          status: '',
          h_perolehan: '',
          nilai_buku: ''
        })
        setFormErrors({
          keterangan: '',
          status: '',
          image: ''
        })
      }
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error('Terjadi kesalahan: ' + error.message)
    }

    setLoading(false)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center">
              ← Kembali ke Beranda
            </Link>
          </div>

        {/* Success Message */}
        {submitSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Data berhasil disimpan!</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Form Input Opname</h1>
          <p className="text-gray-600 mb-8">Pilih asset dan lengkapi data opname untuk pencatatan inventaris</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Cari Asset</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Ketik minimal 4 karakter untuk mencari asset..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute right-3 top-3 w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPendingModal(true)}
                  className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center gap-2 whitespace-nowrap"
                  title="Lihat 10 Asset Belum Diopname"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Top 10 Belum Diopname</span>
                  <span className="sm:hidden">Belum Opname</span>
                  {getPendingAssets().length > 0 && (
                    <span className="ml-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {getPendingAssets().length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filtered Results */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredAssets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery.length > 0 && searchQuery.length < 4
                      ? 'Ketik minimal 4 karakter...'
                      : searchQuery.length >= 4
                      ? 'Tidak ada asset yang cocok'
                      : 'Ketik minimal 4 karakter untuk mencari asset'}
                  </div>
                ) : (
                  filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => !submittedAssets.has(asset.id) && handleAssetChange(asset.id)}
                      className={`p-4 border-b border-gray-100 transition-colors ${
                        submittedAssets.has(asset.id)
                          ? 'cursor-not-allowed opacity-60 bg-gray-50'
                          : 'cursor-pointer hover:bg-gray-50'
                      } ${
                        selectedAsset?.id === asset.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex-1 ${submittedAssets.has(asset.id) ? 'text-gray-500' : ''}`}>
                          <div className={`font-medium ${submittedAssets.has(asset.id) ? 'text-gray-500' : 'text-gray-900'}`}>
                            {asset.name}
                            {submittedAssets.has(asset.id) && ' (Sudah Diopname)'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {asset.no_asset && `No: ${asset.no_asset}`}
                            {asset.merk && ` • ${asset.merk}`}
                          </div>
                        </div>
                        {submittedAssets.has(asset.id) && (
                          <div className="flex items-center space-x-2 ml-4">
                            <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Input
                            </div>
                            <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              Foto
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedAsset && (
              <>
                {/* Asset Details */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Detail Asset</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Merk</label>
                      <input
                        type="text"
                        value={selectedAsset.merk || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tahun</label>
                      <input
                        type="text"
                        value={selectedAsset.tahun || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">No. Asset</label>
                      <input
                        type="text"
                        value={selectedAsset.no_asset || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pemakai</label>
                      <input
                        type="text"
                        value={selectedAsset.pemakai || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site</label>
                      <input
                        type="text"
                        value={selectedAsset.site || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                      <input
                        type="text"
                        value={selectedAsset.lokasi || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Options */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        KETERANGAN <span className="text-red-500">*</span>
                      </h3>
                      {formErrors.keterangan && (
                        <p className="text-sm text-red-600 mb-2">{formErrors.keterangan}</p>
                      )}
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="keterangan"
                            value="ada"
                            checked={formData.keterangan === 'ada'}
                            onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700 font-medium">ADA</span>
                          <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">✓ Asset tersedia</span>
                        </label>
                        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="keterangan"
                            value="tidak_ada"
                            checked={formData.keterangan === 'tidak_ada'}
                            onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700 font-medium">TIDAK ADA</span>
                          <span className="ml-2 text-sm text-red-600 bg-red-100 px-2 py-1 rounded">✗ Asset tidak ditemukan</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        STATUS AKTIVA <span className="text-red-500">*</span>
                      </h3>
                      {formErrors.status && (
                        <p className="text-sm text-red-600 mb-2">{formErrors.status}</p>
                      )}
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="status"
                            value="bagus"
                            checked={formData.status === 'bagus'}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700 font-medium">BAGUS</span>
                          <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded">✓ Kondisi baik</span>
                        </label>
                        <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="radio"
                            name="status"
                            value="rusak"
                            checked={formData.status === 'rusak'}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="text-gray-700 font-medium">RUSAK</span>
                          <span className="ml-2 text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">⚠ Perlu perbaikan</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Values */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">Nilai Asset</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">H. Perolehan</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          Rp
                        </span>
                        <input
                          type="text"
                          placeholder="0"
                          value={formData.h_perolehan ? formatCurrency(formData.h_perolehan) : ''}
                          onChange={(e) => handleCurrencyChange('h_perolehan', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nilai Buku</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          Rp
                        </span>
                        <input
                          type="text"
                          placeholder="0"
                          value={formData.nilai_buku ? formatCurrency(formData.nilai_buku) : ''}
                          onChange={(e) => handleCurrencyChange('nilai_buku', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4 pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Foto Asset <span className="text-red-500">*</span>
                  </h3>
                  {formErrors.image && (
                    <p className="text-sm text-red-600">{formErrors.image}</p>
                  )}
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    formErrors.image ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <svg className={`mx-auto h-12 w-12 mb-4 ${
                      formErrors.image ? 'text-red-400' : 'text-gray-400'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="space-y-2">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Klik untuk upload foto wajib
                        </span>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF hingga 10MB • Foto asset asli diperlukan
                        </p>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setImageFile(e.target.files?.[0] || null)
                          // Clear image error when file is selected
                          if (e.target.files?.[0]) {
                            setFormErrors(prev => ({ ...prev, image: '' }))
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    {imageFile ? (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-700 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          File selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        {imageFile.size > 10 * 1024 * 1024 && (
                          <p className="text-sm text-red-600 mt-1">⚠ File terlalu besar, maksimal 10MB</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          ⚠ Foto asset wajib diupload untuk validasi opname
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="-ml-1 mr-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Simpan Data Opname
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Pending Assets Modal */}
          {showPendingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Top 10 Asset Belum Diopname
                    </h2>
                    <button
                      onClick={() => setShowPendingModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Menampilkan {getPendingAssets().length} asset yang belum diinput data opname-nya
                  </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {getPendingAssets().length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Semua Asset Sudah Diopname!</h3>
                      <p className="text-gray-600">Semua asset telah memiliki data opname yang lengkap.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getPendingAssets().map((asset, index) => (
                        <div
                          key={asset.id}
                          onClick={() => selectPendingAsset(asset)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{asset.name}</h4>
                                <div className="text-sm text-gray-500 space-y-1">
                                  <div className="flex flex-wrap gap-2">
                                    {asset.merk && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {asset.merk}
                                      </span>
                                    )}
                                    {asset.tahun && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        {asset.tahun}
                                      </span>
                                    )}
                                    {asset.no_asset && (
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                        {asset.no_asset}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-4 text-xs">
                                    {asset.pemakai && (
                                      <span className="text-gray-600">
                                        <strong>Pemakai:</strong> {asset.pemakai}
                                      </span>
                                    )}
                                    {asset.site && (
                                      <span className="text-gray-600">
                                        <strong>Site:</strong> {asset.site}
                                      </span>
                                    )}
                                    {asset.lokasi && (
                                      <span className="text-gray-600">
                                        <strong>Lokasi:</strong> {asset.lokasi}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Belum Diopname
                              </span>
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      💡 Klik pada asset untuk langsung mengisi data opname
                    </p>
                    <button
                      onClick={() => setShowPendingModal(false)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
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
    </>
  )
}