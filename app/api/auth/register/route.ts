import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  api_key: process.env.CLOUDINARY_API_KEY || undefined,
  api_secret: process.env.CLOUDINARY_API_SECRET || undefined,
})

async function uploadBufferToCloudinary(buffer: Buffer, folder?: string) {
  const uploadOptions: any = {}
  if (folder) uploadOptions.folder = folder
  return await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
    stream.end(buffer)
  })
}
import { createUser, findByEmail } from '../../../../services/userService'
type IncomingDocsObject = {
  buktiKemitraanBudaya?: any
  dokumenLegal?: any
  suratPernyataanIP?: any
  dokumenKYC?: any
  // english keys
  BUKTI_KEMITRAAN?: any
  DOKUMEN_LEGAL?: any
  SURAT_PERYATAAN_IP?: any
  DOKUMEN_KYC?: any
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let email: any, password: any, fullName: any, nomorTelepon: any, role: any, companyProfile: any, documents: any

    // If multipart/form-data, parse form and upload files to Cloudinary
    if (contentType.includes('multipart/form-data')) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json({ message: 'Cloudinary not configured on server' }, { status: 500 })
      }

      const form = await req.formData()
      email = form.get('email')?.toString()
      password = form.get('password')?.toString()
      fullName = form.get('fullName')?.toString()
      nomorTelepon = form.get('nomorTelepon')?.toString()
      role = form.get('role')?.toString()
      const cpRaw = form.get('companyProfile')?.toString()
      try { companyProfile = cpRaw ? JSON.parse(cpRaw) : undefined } catch { companyProfile = undefined }

      // documents may be provided as files or as JSON string mapping
      documents = []

      // helper to upload a file field if present
      const tryUploadField = async (fieldName: string, docType: string) => {
        const val = form.get(fieldName)
        if (!val) return
        // if string, assume it's a url
        if (typeof val === 'string') {
          documents.push({ type: docType, url: val })
          return
        }
        // otherwise assume it's a File/Blob
        const file: any = val
        if (file && typeof file.arrayBuffer === 'function') {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const folder = form.get('uploadFolder')?.toString() || `users` 
          const res = await uploadBufferToCloudinary(buffer, folder)
          if (res && res.secure_url) documents.push({ type: docType, url: res.secure_url })
        }
      }

      // Try known document field names (Indonesian and English)
      await tryUploadField('buktiKemitraanBudaya', 'BUKTI_KEMITRAAN')
      await tryUploadField('BUKTI_KEMITRAAN', 'BUKTI_KEMITRAAN')
      await tryUploadField('dokumenLegal', 'DOKUMEN_LEGAL')
      await tryUploadField('DOKUMEN_LEGAL', 'DOKUMEN_LEGAL')
      await tryUploadField('suratPernyataanIP', 'SURAT_PERYATAAN_IP')
      await tryUploadField('SURAT_PERYATAAN_IP', 'SURAT_PERYATAAN_IP')
      await tryUploadField('dokumenKYC', 'DOKUMEN_KYC')
      await tryUploadField('DOKUMEN_KYC', 'DOKUMEN_KYC')
      await tryUploadField('dokumenBilling', 'DOKUMEN_BILLING')
      await tryUploadField('DOKUMEN_BILLING', 'DOKUMEN_BILLING')
      await tryUploadField('dokumenPajak', 'DOKUMEN_PAJAK')
      await tryUploadField('DOKUMEN_PAJAK', 'DOKUMEN_PAJAK')

      // also accept a documents JSON string field
      const docsJson = form.get('documents')?.toString()
      if (docsJson) {
        try {
          const parsed = JSON.parse(docsJson)
          if (Array.isArray(parsed)) {
            for (const d of parsed) {
              if (d?.type && d?.url) documents.push(d)
            }
          } else if (typeof parsed === 'object') {
            // object mapping
            for (const k of Object.keys(parsed)) {
              const val = parsed[k]
              if (typeof val === 'string') {
                // map key names to types
                // try to map known keys
                const keyMap: any = {
                  buktiKemitraanBudaya: 'BUKTI_KEMITRAAN',
                  dokumenLegal: 'DOKUMEN_LEGAL',
                  suratPernyataanIP: 'SURAT_PERYATAAN_IP',
                  dokumenKYC: 'DOKUMEN_KYC',
                  dokumenBilling: 'DOKUMEN_BILLING',
                  dokumenPajak: 'DOKUMEN_PAJAK',
                }
                const mapped = keyMap[k] ?? k
                documents.push({ type: mapped, url: val })
              }
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }

    } else {
      const body = await req.json()
      const { email: be, password: bp, fullName: bf, nomorTelepon: bphone, role: brole, companyProfile: bcp, documents: bdocs } = body
      email = be; password = bp; fullName = bf; nomorTelepon = bphone; role = brole; companyProfile = bcp; documents = bdocs
    }

    if (!email || !password) {
      return NextResponse.json({ message: 'email and password required' }, { status: 400 })
    }

    // Basic duplicate check
    const existing = await findByEmail(email)
    if (existing) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 })
    }

    // Normalize companyProfile keys from the frontend (Indonesian names) to our DB shape
    const cp = companyProfile || {}
    const normalizedCompanyProfile = {
      companyName: cp.companyName ?? cp.namaPerusahaan ?? cp.namaPerusahaan ?? undefined,
      industry: cp.industry ?? cp.jenisIndustri ?? undefined,
      companyAddress: cp.companyAddress ?? cp.alamatPerusahaan ?? undefined,
      companyWebsite: cp.companyWebsite ?? cp.situsPerusahaan ?? undefined,
      companyRegistrationNumber: cp.companyRegistrationNumber ?? cp.nomorRegistrasiPerusahaan ?? undefined,
    }

    // Normalize and validate documents
    const docsInput: any = documents || {}
    const docsArray: any[] = []

    function pushDoc(type: string, value: any, required = false) {
      if (!value) return
      // allow passing { filename, url, required } or just url string
      if (typeof value === 'string') {
        docsArray.push({ type, filename: undefined, url: value, required })
      } else if (typeof value === 'object') {
        docsArray.push({ type, filename: value.filename ?? undefined, url: value.url ?? undefined, required: value.required ?? required })
      }
    }

    // if documents sent as array, accept directly
    if (Array.isArray(docsInput)) {
      for (const d of docsInput) {
        if (d?.type) docsArray.push(d)
      }
    } else {
      const obj = docsInput as IncomingDocsObject
      // Indonesian keys
      pushDoc('BUKTI_KEMITRAAN', obj.buktiKemitraanBudaya ?? obj.BUKTI_KEMITRAAN, true)
      pushDoc('DOKUMEN_LEGAL', obj.dokumenLegal ?? obj.DOKUMEN_LEGAL, false)
      pushDoc('SURAT_PERYATAAN_IP', obj.suratPernyataanIP ?? obj.SURAT_PERYATAAN_IP, true)
        pushDoc('DOKUMEN_KYC', obj.dokumenKYC ?? obj.DOKUMEN_KYC, false)
        // license buyer keys
        // allow dokumenBilling / dokumenPajak coming from license buyer UI
        // also accept english-like keys BILLING/PAJAK if provided
        // note: these are optional
        // @ts-ignore
        pushDoc('DOKUMEN_BILLING', (obj as any).dokumenBilling ?? (obj as any).DOKUMEN_BILLING, false)
        // @ts-ignore
        pushDoc('DOKUMEN_PAJAK', (obj as any).dokumenPajak ?? (obj as any).DOKUMEN_PAJAK, false)
    }

    // Block public admin signup unless explicitly allowed
    const requestedRole = role || 'LICENSE_BUYER'
    if (requestedRole === 'ADMIN' && process.env.ALLOW_ADMIN_SIGNUP !== 'true') {
      return NextResponse.json({ message: 'Creating ADMIN via public signup is not allowed' }, { status: 403 })
    }

    // If user registers as CULTURAL_PARTNER, ensure required docs exist
    const desiredRole = requestedRole
    if (desiredRole === 'CULTURAL_PARTNER') {
      const present = new Set(docsArray.map(d => d.type))
      const missingReq = []
      if (!present.has('BUKTI_KEMITRAAN')) missingReq.push('BUKTI_KEMITRAAN')
      if (!present.has('SURAT_PERYATAAN_IP')) missingReq.push('SURAT_PERYATAAN_IP')
      if (missingReq.length > 0) {
        return NextResponse.json({ message: 'Missing required documents for cultural partner', missing: missingReq }, { status: 400 })
      }
      // ensure required docs include a URL
      for (const t of ['BUKTI_KEMITRAAN','SURAT_PERYATAAN_IP']) {
        const doc = docsArray.find(d => d.type === t)
        if (!doc || !doc.url) {
          return NextResponse.json({ message: `${t} must include a file url` }, { status: 400 })
        }
      }
    }

    // ensure every provided document has url (client should upload first and pass metadata)
    for (const d of docsArray) {
      if (!d.url) {
        return NextResponse.json({ message: `Document ${d.type} must include a url` }, { status: 400 })
      }
    }

    const user = await createUser({
      email,
      password,
      fullName,
      phone: nomorTelepon,
      role: desiredRole,
      companyProfile: normalizedCompanyProfile,
      documents: docsArray,
    })

    // remove password before returning
    // @ts-ignore
    if (user.password) delete user.password

    return NextResponse.json(user, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal error' }, { status: 500 })
  }
}
