// @app/api/generate/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // 1. URL Model Anda (Sesuai output sukses tadi)
    const MODEL_URL = "https://router.huggingface.co/models/bayusetia/rupagen-batik-full";
    
    // 2. Kirim Request ke Hugging Face
    const response = await fetch(MODEL_URL, {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        // Tambahkan trigger word "TOK" dan deskripsi styling otomatis
        inputs: `TOK batik pattern, ${prompt}, traditional indonesian art, detailed, 4k`,
        parameters: {
            negative_prompt: "blurry, low quality, distortion, ugly",
            num_inference_steps: 25, // Agar cepat (sekitar 3-5 detik)
            guidance_scale: 7.5
        }
      }),
    });

    // 3. Handle Error (Misal model sedang loading/cold start)
    if (!response.ok) {
        const errorText = await response.text();
        console.error("HF Error:", errorText);
        
        // Jika errornya "Model is loading", beri tahu frontend
        if (errorText.includes("loading")) {
            return NextResponse.json(
                { error: "Model sedang 'pemanasan', coba 20 detik lagi." }, 
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Gagal memproses gambar." }, { status: 500 });
    }

    // 4. Konversi Gambar (Binary) ke Base64 agar bisa tampil di web
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ image: base64Image });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}