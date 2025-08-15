'use client'

import { useState } from 'react'
import Card from '@/components/Card'
import { Badge } from '@/components/Badge'
import { MatrixTable } from '@/components/MatrixTable'
import { downloadCSV } from '@/components/DownloadCSV'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Upload, Download, Rocket, Globe } from 'lucide-react'

type FeatureMap = Record<string, boolean>
type Result = {
  url: string
  title?: string
  description?: string
  textSample?: string
  features: FeatureMap
  pricing?: string | null
}

const DEFAULT_FEATURE_ORDER = [
  'Free trial','Pricing page','Integrations','API available','SSO / SAML','SOC 2 / Security','HIPAA','On‑prem / Self‑hosted','Mobile app','Analytics / Dashboards','AI features','SLAs'
]

export default function Home() {
  const [product, setProduct] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [urls, setUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [useAI, setUseAI] = useState(true); // AI mode on by default


  const run = async () => {
  setLoading(true)
  setResults([])

  try {
    // Clean and split URLs
    const list = urls.split(/\s|,|\n/).map(s => s.trim()).filter(Boolean)

    // Validate URL count
    if (list.length > 5) {
      alert("🚫 Please limit to 5 competitor URLs per run to keep things fast and cost-effective.")
      setLoading(false)
      return
    }

    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: list, mode: useAI ? 'ai' : 'keyword' })

    })

    // Handle bad response (e.g., API key missing, OpenAI error)
    if (!res.ok) {
      const err = await res.json()
      alert("❌ Error: " + (err?.error || "Something went wrong."))
      setLoading(false)
      return
    }

    // Parse and store results
    const data = await res.json()
    setResults(data.results || [])

  } catch (err) {
    console.error("Error during analysis:", err)
    alert("⚠️ Something went wrong. Please try again.")
  }

  // Always reset loading
  setLoading(false)
}


  const headers = [...DEFAULT_FEATURE_ORDER, 'Pricing signal']
  const rows = results.map(r => ({
    name: r.title ? `${r.title}` : r.url,
    cells: [...DEFAULT_FEATURE_ORDER.map(k => r.features[k] ?? false), r.pricing || '—']
  }))

  const dataPoints = results.map(r => {
    const score = DEFAULT_FEATURE_ORDER.reduce((acc, k) => acc + (r.features[k] ? 1 : 0), 0)
    // uniqueness: features this site has that > half of others don't
    const uniques = DEFAULT_FEATURE_ORDER.filter(k => {
      const yesCount = results.reduce((acc, x) => acc + (x.features[k] ? 1 : 0), 0)
      const thisYes = r.features[k] ? 1 : 0
      return thisYes && yesCount <= results.length / 2
    }).length
    return { name: r.title || r.url, x: score, y: uniques }
  })

  const exportCSV = () => {
    const rowsCSV = [['Competitor', ...headers]]
    for (const r of results){
      const name = r.title || r.url
      const cells = DEFAULT_FEATURE_ORDER.map(k => (r.features[k] ? 'Yes' : 'No'))
      rowsCSV.push([name, ...cells, r.pricing || ''])
    }
    downloadCSV('competitive-matrix.csv', rowsCSV)
  }

  return (
    <main className="space-y-6">
      <section className="text-center pt-10 pb-6">
        <p className="mt-3 text-slate-600 text-lg max-w-2xl mx-auto">
          ProductLens is a lightweight tool for product managers to instantly compare competitors,
          analyze features with AI, and export a clean competitive matrix — in seconds.
        </p>
      </section>
      <Card title="Setup">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600">Your product</label>
            <input className="w-full border rounded-lg p-2" placeholder="Ex: ProductLens" value={product} onChange={e => setProduct(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Competitors (names)</label>
            <input className="w-full border rounded-lg p-2" placeholder="Ex: Rival A, Rival B" value={competitors} onChange={e => setCompetitors(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-600">Competitor URLs (comma/space/newline separated)</label>
            <textarea className="w-full border rounded-lg p-2 h-24" placeholder="https://example.com, https://example2.com" value={urls} onChange={e => setUrls(e.target.value)} />
          </div>
        </div>

                {/* Mode toggle */}
        <div className="mt-3 flex items-center gap-3">
          <div className="text-sm text-slate-700">Mode:</div>
          <button
            type="button"
            onClick={() => setUseAI(prev => !prev)}
            className={`relative inline-flex h-8 items-center rounded-full px-2 text-xs font-medium transition-colors border ${
              useAI ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
            aria-pressed={useAI}
          >
            <span className={`inline-block rounded-full px-3 py-1 transition-all ${useAI ? 'bg-white/20' : 'bg-white text-slate-700'}`}>
              {useAI ? 'AI mode' : 'Keyword mode'}
            </span>
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={run} disabled={loading} className="rounded-lg px-3 py-2 border bg-black text-white flex items-center gap-2">
            <Rocket size={16}/> {loading ? 'Analyzing...' : 'Analyze Competitors'}
          </button>
          <button onClick={exportCSV} disabled={!results.length} className="rounded-lg px-3 py-2 border flex items-center gap-2">
            <Download size={16}/> Export CSV
          </button>
          <a href="https://github.com/new" target="_blank" className="rounded-lg px-3 py-2 border flex items-center gap-2">
            <Upload size={16}/> Duplicate as your repo
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-2">Tip: Include pricing/feature pages for better signals.</p>
      </Card>

      {results.length > 0 && (
        <>
          <Card title="Competitive Matrix">
            <MatrixTable headers={headers} rows={rows} />
          </Card>

          <Card title="Positioning Map">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Feature richness" />
                  <YAxis type="number" dataKey="y" name="Differentiation" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={dataPoints} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-500">X: how many common features detected. Y: how many features that others don’t mention (simple uniqueness proxy).</div>
          </Card>

          <Card title="Snippets & Signals">
            <div className="grid md:grid-cols-2 gap-4">
              {results.map((r, idx) => (
                <div key={idx} className="rounded-xl border p-3">
                  <div className="font-medium">{r.title || r.url}</div>
                  <div className="text-xs text-slate-500 break-words">{r.url}</div>
                  <div className="mt-2 text-sm">{r.description || r.textSample || 'No snippet found.'}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(r.features).filter(([,v]) => v).map(([k]) => <Badge key={k}>{k}</Badge>)}
                  </div>
                  <div className="text-xs mt-2">{r.pricing ? `Pricing: ${r.pricing}` : ''}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </main>
  )
}
