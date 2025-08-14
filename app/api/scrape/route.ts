import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'

type SiteData = {
  url: string
  title?: string
  description?: string
  textSample?: string
  features: Record<string, boolean>
  pricing?: string | null
}

const FEATURE_KEYWORDS: Record<string, string[]> = {
  'Free trial': ['free trial', 'try free', 'start free'],
  'Pricing page': ['pricing', 'plans', 'cost'],
  'Integrations': ['integrations', 'integrates with', 'integration partners'],
  'API available': ['api reference', 'public api', 'rest api', 'graphql'],
  'SSO / SAML': ['sso', 'saml'],
  'SOC 2 / Security': ['soc 2', 'security', 'compliance'],
  'HIPAA': ['hipaa'],
  'On-prem / Self-hosted': ['self-host', 'self hosted', 'on-prem', 'on prem'],
  'Mobile app': ['app store', 'google play', 'ios app', 'android app'],
  'Analytics / Dashboards': ['analytics', 'dashboard', 'insights'],
  'AI features': ['ai', 'machine learning', 'llm', 'copilot'],
  'SLAs': ['sla', 'uptime', '99.9%']
}

function detectFeatures(text: string){
  const lc = text.toLowerCase()
  const out: Record<string, boolean> = {}
  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    out[feature] = keywords.some(k => lc.includes(k))
  }
  return out
}

function extractPricing($: cheerio.CheerioAPI){
  const text = $('body').text().toLowerCase()
  const money = text.match(/\$\s?\d+[\d\.,]*/g)
  const hasPricingWords = text.includes('pricing') || text.includes('plans')
  if (money && money.length){
    const first = money.slice(0,5).join(', ')
    return `$ detected: ${first}${hasPricingWords ? ' (pricing page keywords found)' : ''}`
  }
  return hasPricingWords ? 'Pricing keywords found' : null
}

// --- AI helper
async function aiAnalyze(content: string){
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY not set')

  const SYSTEM_PROMPT = `
You help a Product Manager compare competitors. Given page text, return:
- short summary
- boolean features for: Free trial, Pricing page, Integrations, API available, SSO / SAML, SOC 2 / Security, HIPAA, On-prem / Self-hosted, Mobile app, Analytics / Dashboards, AI features, SLAs
Respond ONLY as compact JSON: {"summary":"...", "features": { "Free trial": true, ... }}
`.trim()

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',  // cost-effective
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: content.slice(0, 8000) }
      ]
    })
  })
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message || 'OpenAI API error')
  const text = data.choices?.[0]?.message?.content || '{}'
  let parsed: any = {}
  try { parsed = JSON.parse(text) } catch {}
  return { summary: parsed.summary || '', features: parsed.features || {} }
}

export async function POST(req: NextRequest){
  try {
    const { urls, mode } = await req.json() as { urls: string[], mode?: 'ai' | 'keyword' }
    if (!urls?.length) return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    if (urls.length > 5) return NextResponse.json({ error: 'Maximum of 5 URLs allowed per analysis' }, { status: 400 })

    const results: SiteData[] = []
    for (const url of urls){
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CompassBot/1.0)' } })
        const html = await res.text()
        const $ = cheerio.load(html)
        const title = $('title').first().text().trim() || url
        const descriptionMeta = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || undefined
        const textSample = $('h1,h2,h3,p,li').slice(0, 30).text().replace(/\s+/g, ' ').trim().slice(0, 600)
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

        if (mode === 'ai') {
          const ai = await aiAnalyze(bodyText)
          results.push({ url, title, description: ai.summary || descriptionMeta, textSample, features: ai.features, pricing: extractPricing($) })
        } else {
          const features = detectFeatures(bodyText)
          results.push({ url, title, description: descriptionMeta, textSample, features, pricing: extractPricing($) })
        }
      } catch (e: any){
        results.push({ url, title: 'Failed to analyze', description: e?.message || 'fetch failed', features: {}, pricing: null })
      }
    }

    return NextResponse.json({ results })
  } catch (e:any){
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
