import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt, ragUrl } = await req.json()

  let ragContent = ''

  // ragUrl이 존재할 경우에만 IPFS에서 fetch
  if (typeof ragUrl === 'string' && ragUrl.startsWith('ipfs://')) {
    try {
      ragContent = await fetch(ragUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.text())
    } catch (err) {
      console.warn('⚠️ Failed to fetch RAG content:', err)
    }
  }

  const apiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        ...(ragContent
          ? [{
              role: 'system',
              content: `You are a Solidity smart contract generator. Here's your RAG knowledge:\n${ragContent}`,
            }]
          : []),
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'deepseek-chat',
    }),
  })

  const text = await apiRes.text()

  try {
    const completion = JSON.parse(text)
    console.log('✅ DeepSeek 응답:', JSON.stringify(completion, null, 2))
    return NextResponse.json({
      contract: completion.choices?.[0]?.message?.content || 'No response',
    })
  } catch (e) {
    console.error('🛑 Failed to parse DeepSeek response:', text)
    return NextResponse.json({ error: 'Invalid response from DeepSeek', raw: text }, { status: 500 })
  }
}
