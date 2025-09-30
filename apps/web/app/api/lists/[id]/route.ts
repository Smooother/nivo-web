import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('company_lists')
    .select('*, items:company_list_items(*)')
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ list: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const body = await req.json();
  const { name, description } = body;
  const { data, error } = await supabase
    .from('company_lists')
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ list: data });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from('company_lists').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

