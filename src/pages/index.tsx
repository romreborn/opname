import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Inventory Opname System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistem pencatatan inventaris asset perusahaan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/input">
            <div className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Input Data Opname
              </h2>
              <p className="text-gray-600 text-center">
                Masukkan data opname asset baru
              </p>
            </div>
          </Link>

          <Link href="/report">
            <div className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Laporan Opname
              </h2>
              <p className="text-gray-600 text-center">
                Lihat laporan data opname yang telah dicatat
              </p>
            </div>
          </Link>

          <Link href="/upload">
            <div className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Upload Excel Database
              </h2>
              <p className="text-gray-600 text-center">
                Upload file Excel untuk mengisi data assets
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selamat Datang di Sistem Inventory Opname
            </h3>
            <p className="text-gray-600">
              Sistem ini membantu Anda mencatat dan melacak inventory asset perusahaan dengan mudah dan efisien.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}