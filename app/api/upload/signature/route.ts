import crypto from 'crypto'

type ResponseBody = {
  apiKey: string
  cloudName: string
  timestamp: number
  signature: string
  folder?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const folder = typeof body?.folder === 'string' && body.folder.trim() ? body.folder.trim() : undefined

    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (!apiKey || !apiSecret || !cloudName) {
      return new Response(JSON.stringify({ error: 'Cloudinary not configured on server' }), { status: 500 })
    }

    const timestamp = Math.floor(Date.now() / 1000)

    // Cloudinary requires parameters to be sorted lexicographically when signing.
    const parts: string[] = []
    if (folder) parts.push(`folder=${folder}`)
    parts.push(`timestamp=${timestamp}`)
    const toSign = parts.join('&')

    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex')

    const resp: ResponseBody = {
      apiKey,
      cloudName,
      timestamp,
      signature,
    }
    if (folder) resp.folder = folder

    return new Response(JSON.stringify(resp), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'unknown' }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, info: 'POST to this endpoint with optional { folder } to get signature' }), { headers: { 'Content-Type': 'application/json' } })
}
