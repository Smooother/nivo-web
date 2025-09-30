export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { webSearch } from '@/lib/search';
import { fetchAndExtract } from '@/app/lib/fetchPage';
import { analyzeCompany } from '@/app/lib/ai';
import pLimit from 'p-limit';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  const body = await req.json();
  const { listId, analysisKind, params, force, provider } = body as {
    listId: string;
    analysisKind: 'financial' | 'commercial' | 'both';
    params?: any;
    force?: boolean;
    provider?: string;
  };

  if (!listId || !analysisKind) return NextResponse.json({ error: 'missing fields' }, { status: 400 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: run, error: runErr } = await supabase
    .from('company_ai_runs')
    .insert({ list_id: listId, analysis_kind: analysisKind, params, status: 'running', created_by: user.id, started_at: new Date().toISOString() })
    .select('*')
    .single();
  if (runErr || !run) return NextResponse.json({ error: runErr?.message || 'failed to create run' }, { status: 500 });

  const { data: items, error: itemsErr } = await supabase
    .from('company_list_items')
    .select('org_number')
    .eq('list_id', listId);
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const orgs = (items ?? []).map((i) => i.org_number);
  const limit = pLimit(4);
  const cookieStore = cookies();
  const selectedProvider = (provider || cookieStore.get('search_provider')?.value || process.env.SEARCH_API_PROVIDER || 'tavily').toLowerCase();

  const analyzeOne = async (org_number: string) => {
    try {
      // 24h cache reuse
      if (!force) {
        const { data: cached } = await supabase
          .from('company_ai_findings')
          .select('*')
          .eq('org_number', org_number)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cached) {
          // copy into this run
          await supabase.from('company_ai_findings').insert({
            run_id: run.id,
            org_number,
            summary: cached.summary,
            sources: cached.sources,
            scores: cached.scores,
          });
          return;
        }
      }

      // Minimal company and financials
      const { data: company } = await supabase
        .from('companies')
        .select('org_number, name, industry')
        .eq('org_number', org_number)
        .single();
      const { data: financialRows } = await supabase
        .from('company_accounts')
        .select('*')
        .eq('org_number', org_number)
        .order('year', { ascending: false })
        .limit(3);

      const financials = (financialRows ?? []).map((r) => ({ year: r.year, revenue: r.revenue, ebit: r.ebit, ebitda: r.ebitda, margin: r.margin }));

      const query = `"${company?.name || org_number}" ${company?.industry || ''} company news`;
      const sources = await webSearch(query, { provider: selectedProvider, num: 5 });
      const docs = await Promise.all(
        sources.slice(0, 5).map(async (s) => {
          const page = await fetchAndExtract(s.url);
          return { url: s.url, title: page.title || s.title, text: page.text };
        }),
      );

      const finding = await analyzeCompany({ company: { org_number, name: company?.name, industry: company?.industry }, financials, publicDocs: docs, kind: analysisKind });
      await supabase.from('company_ai_findings').insert({ run_id: run.id, org_number, summary: finding.summary as any, sources: finding.sources as any, scores: finding.scores as any });
    } catch (e: any) {
      console.error('analyze error', org_number, e?.message);
    }
  };

  await Promise.all(orgs.map((org) => limit(() => analyzeOne(org))));

  await supabase
    .from('company_ai_runs')
    .update({ status: 'done', finished_at: new Date().toISOString() })
    .eq('id', run.id);

  return NextResponse.json({ runId: run.id });
}

