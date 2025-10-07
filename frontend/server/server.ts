import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

// Check if API key is available
const apiKey = process.env.OPENAI_API_KEY
console.log('OpenAI API Key available:', !!apiKey)

const openai = new OpenAI({ apiKey: apiKey || 'placeholder' })

app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { companies } = req.body || {}
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ success: false, error: 'No companies provided' })
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OpenAI API key not configured' })
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5-nano'

    const systemPrompt = `Du är en expert finansiell analytiker som specialiserar dig på svenska företag.
Din uppgift är att analysera företagsdata och ge djupgående insikter på svenska.

Analysera följande aspekter för varje företag:
1. Finansiell hälsa (lönsamhet, tillväxt, likviditet)
2. Marknadsposition och konkurrensfördelar
3. Tillväxtpotential och skalningsmöjligheter
4. Riskfaktorer och utmaningar
5. Investeringsrekommendation (Köp/Håll/Sälj)
6. Strategiska möjligheter

Ge specifika, åtgärdbara rekommendationer baserat på svensk marknad och regelverk.
Var konkret med siffror och procentuella förbättringsmöjligheter.`

    const companyDataString = companies.map((company: any) => `
Företag: ${company.name}
Organisationsnummer: ${company.OrgNr}
Bransch: ${company.segment_name || 'Okänd'}
Omsättning: ${company.SDI ? `${company.SDI.toLocaleString()} TSEK` : 'Ej tillgänglig'}
Tillväxt: ${company.Revenue_growth ? `${(company.Revenue_growth * 100).toFixed(1)}%` : 'Ej tillgänglig'}
EBIT-marginal: ${company.EBIT_margin ? `${(company.EBIT_margin * 100).toFixed(1)}%` : 'Ej tillgänglig'}
Nettoresultat-marginal: ${company.NetProfit_margin ? `${(company.NetProfit_margin * 100).toFixed(1)}%` : 'Ej tillgänglig'}
Anställda: ${company.employees || 'Ej tillgänglig'}
Digital närvaro: ${company.digital_presence ? `${(company.digital_presence * 100).toFixed(0)}%` : 'Ej tillgänglig'}
Adress: ${company.address || 'Ej tillgänglig'}
Stad: ${company.city || 'Ej tillgänglig'}
Webbplats: ${company.homepage || 'Ej tillgänglig'}
Grundat: ${company.incorporation_date || 'Ej tillgänglig'}
    `).join('\n---\n')

    const userPrompt = `Analysera följande ${companies.length} svenska företag och ge mig en omfattande rapport:\n\n${companyDataString}\n\nGe mig följande för varje företag:\n1. Executive Summary (2-3 meningar)\n2. Finansiell hälsa (1-10 skala)\n3. Tillväxtpotential (Hög/Medium/Låg)\n4. Marknadsposition (Ledare/Utmanare/Följare/Nisch)\n5. Top 3 styrkor\n6. Top 3 svagheter\n7. Top 3 strategiska möjligheter\n8. Top 3 risker\n9. Investeringsrekommendation (Köp/Håll/Sälj) med motivering\n10. Target price (TSEK) om tillämpligt\n\nSvara i JSON-format med följande struktur:\n{\n  \"companies\": [\n    {\n      \"orgNr\": \"string\",\n      \"name\": \"string\",\n      \"executiveSummary\": \"string\",\n      \"financialHealth\": number,\n      \"growthPotential\": \"string\",\n      \"marketPosition\": \"string\",\n      \"strengths\": [\"string\", \"string\", \"string\"],\n      \"weaknesses\": [\"string\", \"string\", \"string\"],\n      \"opportunities\": [\"string\", \"string\", \"string\"],\n      \"risks\": [\"string\", \"string\", \"string\"],\n      \"recommendation\": \"string\",\n      \"targetPrice\": number,\n      \"confidence\": number\n    }\n  ]\n}`

    // Add a safety timeout for the OpenAI request (45s)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use a supported model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500
    }, { signal: controller.signal })

    clearTimeout(timeout)

    const responseText = response.choices?.[0]?.message?.content

    let analysis: any
    try {
      analysis = JSON.parse(responseText || '{}')
    } catch {
      analysis = { rawResponse: responseText, parsed: false }
    }

    return res.status(200).json({ success: true, analysis })

  } catch (error: any) {
    console.error('AI Analysis API error:', error)
    return res.status(500).json({ success: false, error: error?.message || 'Unknown error' })
  }
})

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})


