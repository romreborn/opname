import React, { useState, useRef } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface ExcelData {
  [key: string]: any
}

interface ColumnMapping {
  [key: string]: string // Maps Excel column names to database field names
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [excelData, setExcelData] = useState<ExcelData[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({})
  const [mappedData, setMappedData] = useState<ExcelData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'uploading'>('upload')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Database fields from schema
  const dbFields = ['name', 'merk', 'tahun', 'no_asset', 'pemakai', 'site', 'lokasi']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile)
        setError(null)
        parseExcelFile(selectedFile)
      } else {
        setError('Please upload a valid Excel file (.xlsx or .xls)')
      }
    }
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length > 1) {
          // First row contains headers
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]

          const parsedData: ExcelData[] = rows.map(row => {
            const obj: ExcelData = {}
            headers.forEach((header, index) => {
              obj[header] = row[index]
            })
            return obj
          })

          setExcelData(parsedData)
          setStep('mapping')

          // Auto-detect column mappings
          autoDetectMappings(headers)
        } else {
          toast.error('Excel file appears to be empty or has no data')
          setError('Excel file appears to be empty or has no data')
        }
      } catch (err) {
        toast.error('Failed to parse Excel file. Please check the file format.')
        setError('Failed to parse Excel file. Please check the file format.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const autoDetectMappings = (headers: string[]) => {
    const autoMapping: ColumnMapping = {}

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim()

      // Simple pattern matching for common field names
      if (lowerHeader.includes('nama') || lowerHeader.includes('name')) {
        autoMapping[header] = 'name'
      } else if (lowerHeader.includes('merk') || lowerHeader.includes('brand')) {
        autoMapping[header] = 'merk'
      } else if (lowerHeader.includes('tahun') || lowerHeader.includes('year')) {
        autoMapping[header] = 'tahun'
      } else if (lowerHeader.includes('asset') || lowerHeader.includes('no') || lowerHeader.includes('kode')) {
        autoMapping[header] = 'no_asset'
      } else if (lowerHeader.includes('pemakai') || lowerHeader.includes('user')) {
        autoMapping[header] = 'pemakai'
      } else if (lowerHeader.includes('site') || lowerHeader.includes('lokasi') || lowerHeader.includes('location')) {
        if (lowerHeader.includes('site')) {
          autoMapping[header] = 'site'
        } else {
          autoMapping[header] = 'lokasi'
        }
      }
    })

    setColumnMapping(autoMapping)
  }

  const handleMappingChange = (excelColumn: string, dbField: string) => {
    const newMapping = { ...columnMapping }

    // Remove this dbField from any other Excel column
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === dbField && key !== excelColumn) {
        delete newMapping[key]
      }
    })

    if (dbField) {
      newMapping[excelColumn] = dbField
    } else {
      delete newMapping[excelColumn]
    }

    setColumnMapping(newMapping)
  }

  const proceedToPreview = () => {
    const mapped = excelData.map(row => {
      const mappedRow: ExcelData = {}

      Object.entries(columnMapping).forEach(([excelCol, dbField]) => {
        mappedRow[dbField] = row[excelCol]
      })

      return mappedRow
    })

    setMappedData(mapped)
    setStep('preview')
  }

  const validateData = (data: ExcelData[]) => {
    const errors: string[] = []

    data.forEach((row, index) => {
      if (!row.name || row.name.toString().trim() === '') {
        errors.push(`Row ${index + 2}: Name is required`)
      }

      if (row.tahun && isNaN(Number(row.tahun))) {
        errors.push(`Row ${index + 2}: Year must be a valid number`)
      }
    })

    return errors
  }

  const handleUpload = async () => {
    setIsLoading(true)
    setStep('uploading')

    try {
      const validationErrors = validateData(mappedData)
      if (validationErrors.length > 0) {
        toast.error('Validation errors found:\n' + validationErrors.join('\n'))
        setError('Validation errors found:\n' + validationErrors.join('\n'))
        setStep('preview')
        return
      }

      // Format data for database
      const formattedData = mappedData.map(row => ({
        name: row.name?.toString().trim() || '',
        merk: row.merk?.toString().trim() || null,
        tahun: row.tahun ? parseInt(row.tahun.toString()) : null,
        no_asset: row.no_asset?.toString().trim() || null,
        pemakai: row.pemakai?.toString().trim() || null,
        site: row.site?.toString().trim() || null,
        lokasi: row.lokasi?.toString().trim() || null,
        created_at: new Date().toISOString()
      }))

      // Insert data in batches to avoid timeouts
      const batchSize = 100
      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize)
        const { data, error } = await supabase
          .from('assets')
          .insert(batch)

        if (error) {
          throw new Error(`Failed to insert batch ${i / batchSize + 1}: ${error.message}`)
        }
      }

      // Success
      toast.success(`Successfully uploaded ${formattedData.length} assets to database!`, {
        duration: 6000,
        icon: '🎉',
      })
      resetForm()

    } catch (err: any) {
      toast.error(err.message || 'Failed to upload data to database')
      setError(err.message || 'Failed to upload data to database')
      setStep('preview')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setExcelData([])
    setColumnMapping({})
    setMappedData([])
    setError(null)
    setStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-green-600 hover:text-green-800 flex items-center">
            ← Kembali ke Beranda
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upload Excel Database</h1>
            <p className="text-gray-600 mt-2">Upload file Excel untuk mengisi data assets</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex items-center ${step === 'upload' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Upload File</span>
              </div>
              <div className={`flex items-center ${step === 'mapping' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Mapping Kolom</span>
              </div>
              <div className={`flex items-center ${step === 'preview' || step === 'uploading' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' || step === 'uploading' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                  3
                </div>
                <span className="ml-2 font-medium">Preview & Upload</span>
              </div>
            </div>
          </div>

          {/* Step 1: File Upload */}
          {step === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
              <p className="text-gray-600 mb-4">Pilih file Excel (.xlsx atau .xls) yang berisi data assets</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
              >
                Pilih File
              </label>
              {file && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">File dipilih: <span className="font-medium">{file.name}</span></p>
                  <p className="text-sm text-gray-600">Ukuran: <span className="font-medium">{(file.size / 1024).toFixed(2)} KB</span></p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mapping Kolom Excel ke Database</h3>
                <p className="text-sm text-gray-600 mb-4">Pilih kolom database yang sesuai dengan setiap kolom Excel</p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {excelData.length > 0 && Object.keys(excelData[0]).map(excelCol => (
                    <div key={excelCol} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Kolom Excel: "{excelCol}"
                        </label>
                      </div>
                      <div className="flex-1">
                        <select
                          value={columnMapping[excelCol] || ''}
                          onChange={(e) => handleMappingChange(excelCol, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">-- Pilih Field Database --</option>
                          {dbFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={proceedToPreview}
                  disabled={Object.keys(columnMapping).length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Lanjut ke Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Menampilkan {mappedData.length} data yang akan diupload
                </p>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">No</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Merk</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Tahun</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">No. Asset</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Pemakai</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Site</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Lokasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-300 px-4 py-2">{idx + 1}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.name || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.merk || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.tahun || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.no_asset || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.pemakai || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.site || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2">{row.lokasi || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mappedData.length > 10 && (
                    <p className="text-sm text-gray-600 mt-2">
                      ... dan {mappedData.length - 10} data lainnya
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Mengupload...' : 'Upload ke Database'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Uploading */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sedang Mengupload</h3>
              <p className="text-gray-600">Mohon tunggu, data sedang diupload ke database...</p>
            </div>
          )}

          {/* Instructions */}
          {step === 'upload' && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Petunjuk Format Excel:</h4>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>File harus dalam format .xlsx atau .xls</li>
                <li>Baris pertama harus berisi nama kolom</li>
                <li>Field 'name' (nama asset) wajib diisi</li>
                <li>Field yang tersedia: name (wajib), merk, tahun, no_asset, pemakai, site, lokasi</li>
                <li>Pastikan data tidak ada yang kosong pada field wajib</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}