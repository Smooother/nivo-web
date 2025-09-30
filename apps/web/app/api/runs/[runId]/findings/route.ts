import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(_: NextRequest, { params }: { params: { runId: string } }) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('company_ai_findings')
    .select('*')
    .eq('run_id', params.runId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ findings: data ?? [] });
}

