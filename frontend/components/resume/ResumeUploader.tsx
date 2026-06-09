'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, File, Loader2, CheckCircle2 } from 'lucide-react'
import { uploadResume } from '@/lib/api'
import { Resume } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  onSuccess: (resume: Resume) => void
}

export default function ResumeUploader({ onSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [successFile, setSuccessFile] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    try {
      const data = await uploadResume(file)
      setSuccessFile(file.name)
      toast.success('Resume uploaded and processed successfully')
      setTimeout(() => onSuccess(data), 1500)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to upload resume')
    } finally {
      setIsUploading(false)
    }
  }, [onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading
  })

  return (
    <div
      {...getRootProps()}
      className={`glass-card p-12 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
        isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="flex flex-col items-center text-blue-400">
          <Loader2 className="w-12 h-12 mb-4 animate-spin" />
          <p className="font-medium text-lg">Processing with BERT NLP model...</p>
          <p className="text-sm text-slate-400 mt-2">Extracting skills and entities</p>
        </div>
      ) : successFile ? (
        <div className="flex flex-col items-center text-emerald-400">
          <CheckCircle2 className="w-12 h-12 mb-4" />
          <p className="font-medium text-lg">Upload Complete!</p>
          <p className="text-sm text-emerald-500/70 mt-2">{successFile}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <UploadCloud className="w-12 h-12 mb-4 text-slate-500" />
          <p className="font-medium text-lg text-slate-300">Drag & drop your resume PDF here</p>
          <p className="text-sm mt-2">or click to browse from your computer</p>
          <p className="text-xs mt-6 text-slate-500">Only PDF files supported</p>
        </div>
      )}
    </div>
  )
}
