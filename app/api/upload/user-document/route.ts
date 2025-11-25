import { v2 as cloudinary } from 'cloudinary'
import { setDocumentUrl, findById } from '../../../../services/userService'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  api_key: process.env.CLOUDINARY_API_KEY || undefined,
  api_secret: process.env.CLOUDINARY_API_SECRET || undefined,
})

async function uploadBuffer(buffer: Buffer, folder?: string) {
  const opts: any = {}
  if (folder) opts.folder = folder
  return await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opts, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
    stream.end(buffer)
  })
}

export async function POST(req: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return new Response(JSON.stringify({ error: 'Cloudinary not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Expected multipart/form-data with fields: userId, type and file' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const form = await req.formData()
    const userId = form.get('userId')?.toString()
    const type = form.get('type')?.toString()
    const folder = form.get('folder')?.toString() || undefined
    const file = form.get('file') as any

    if (!userId || !type || !file) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, type, file' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // ensure user exists
    const existing = await findById(userId)
    if (!existing) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const res = await uploadBuffer(buffer, folder)
    if (!res || !res.secure_url) {
      return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // Save secure_url to user's corresponding field
    const updated = await setDocumentUrl(userId, type, res.secure_url)

    return new Response(JSON.stringify({ ok: true, url: res.secure_url, user: updated }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ info: 'POST multipart/form-data with userId, type, file (and optional folder). Saves Cloudinary URL to user record.' }), { headers: { 'Content-Type': 'application/json' } })
}
