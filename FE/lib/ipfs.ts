'use client'

export async function uploadToIPFS(file: File): Promise<string> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT
  if (!jwt) throw new Error('PINATA_JWT is not defined in .env')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: jwt,
    },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Pinata upload failed: ${text}`)
  }

  const data = await res.json()
  return data.IpfsHash // CID 반환
}
