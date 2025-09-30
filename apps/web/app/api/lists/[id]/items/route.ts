import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('company_list_items')
    .select('*')
    .eq('list_id', params.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const body = await req.json();
  const { org_number, note } = body as { org_number: string; note?: string };
  if (!org_number) return NextResponse.json({ error: 'org_number required' }, { status: 400 });
  const { data, error } = await supabase
    .from('company_list_items')
    .insert({ list_id: params.id, org_number, note })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const org_number = searchParams.get('org_number');
  if (!org_number) return NextResponse.json({ error: 'org_number required' }, { status: 400 });
  const { error } = await supabase
    .from('company_list_items')
    .delete()
    .eq('list_id', params.id)
    .eq('org_number', org_number);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

