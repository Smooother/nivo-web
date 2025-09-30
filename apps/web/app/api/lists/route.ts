import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = getSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('company_lists')
    .select('*, items:company_list_items(count)')
    .eq('owner_user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lists: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, org_numbers }: { name: string; description?: string; org_numbers?: string[] } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data: list, error } = await supabase
    .from('company_lists')
    .insert({ name, description, owner_user_id: user.id })
    .select('*')
    .single();
  if (error || !list) return NextResponse.json({ error: error?.message || 'failed to create' }, { status: 500 });

  if (org_numbers?.length) {
    const rows = org_numbers.map((org) => ({ list_id: list.id, org_number: org }));
    // batch in chunks of 1000
    const chunkSize = 1000;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('company_list_items').insert(chunk);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ list });
}

