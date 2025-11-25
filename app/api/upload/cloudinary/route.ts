import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  api_key: process.env.CLOUDINARY_API_KEY || undefined,
  api_secret: process.env.CLOUDINARY_API_SECRET || undefined,
})

function missingConfigResponse() {
  return new Response(JSON.stringify({ error: 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in env.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return missingConfigResponse()
  }

  // Expect multipart/form-data with a `file` field (File) and optional `folder` string
  try {
    const form = await req.formData()
    const file = form.get('file') as any
    const folder = form.get('folder') as string | null

    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing file in form-data (field name: file)' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // file is a Blob / File - convert to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadOptions: any = {}
    if (folder && typeof folder === 'string' && folder.trim()) uploadOptions.folder = folder.trim()

    // return a promise that resolves when upload finishes
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, res) => {
        if (error) return reject(error)
        resolve(res)
      })
      stream.end(buffer)
    })

    // result contains secure_url and other metadata
    return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, info: 'POST multipart/form-data to this endpoint with field `file` and optional `folder`' }), { headers: { 'Content-Type': 'application/json' } })
}
