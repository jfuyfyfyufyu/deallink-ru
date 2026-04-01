import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const statusLabels: Record<string, string> = {
  requested: '📩 Новая заявка',
  counter_proposed: '✏️ Блогер предложил правки',
  approved: '✅ Сделка одобрена',
  ordered: '📦 Товар заказан',
  in_pvz: '🏪 Заказ в ПВЗ',
  picked_up: '🎒 Посылка забрана',
  filming: '🎬 Съёмка контента',
  review_posted: '📝 Контент опубликован',
  finished: '🏁 Сделка завершена',
  cancelled: '❌ Сделка отменена',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { deal_id, seller_id, blogger_id, old_status, new_status } = body;
  if (!deal_id || !seller_id || !new_status) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Determine who to notify: seller gets notified about blogger actions, blogger about seller actions
  // For now, notify seller about all status changes (the trigger fires on any update)
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('telegram_id, name')
    .eq('user_id', seller_id)
    .single();

  const { data: bloggerProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('user_id', blogger_id)
    .single();

  // Get product name
  const { data: deal } = await supabase
    .from('deals')
    .select('product_id')
    .eq('id', deal_id)
    .single();

  let productName = 'товар';
  if (deal?.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', deal.product_id)
      .single();
    if (product?.name) productName = product.name;
  }

  const label = statusLabels[new_status] || new_status;
  const bloggerName = bloggerProfile?.name || 'Блогер';

  // Notify the seller
  if (sellerProfile?.telegram_id) {
    const text = `<b>${label}</b>\n\nБлогер <b>${bloggerName}</b> обновил статус сделки по товару «${productName}»`;

    const sendBody: any = {
      chat_id: Number(sellerProfile.telegram_id),
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Открыть сделки', url: 'https://deallink-ru.lovable.app/seller/deals' },
        ]],
      },
    };

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendBody),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Telegram send failed:', data);
    }
  }

  // Also save notification in DB for seller
  await supabase.from('notifications').insert({
    user_id: seller_id,
    title: label,
    message: `Блогер ${bloggerName} обновил статус сделки по товару «${productName}»`,
    deal_id,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
