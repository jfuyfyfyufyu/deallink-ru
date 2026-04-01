import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendMessage(chatId: number, text: string, lovableKey: string, telegramKey: string, inline_keyboard?: any[]) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (inline_keyboard) {
    body.reply_markup = { inline_keyboard };
  }
  await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': telegramKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Check if this is a quick poll (from auth page) or cron poll
  let isQuick = false;
  try {
    const body = await req.json();
    isQuick = body?.mode === 'quick';
  } catch {}

  const maxRuntime = isQuick ? 5_000 : MAX_RUNTIME_MS;
  const startTime = Date.now();
  let totalProcessed = 0;

  // Read initial offset
  const { data: state, error: stateErr } = await supabase
    .from('telegram_bot_state')
    .select('update_offset')
    .eq('id', 1)
    .single();

  if (stateErr) {
    return new Response(JSON.stringify({ error: stateErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let currentOffset = state.update_offset;

  while (true) {
    const elapsed = Date.now() - startTime;
    const remainingMs = maxRuntime - elapsed;
    if (remainingMs < MIN_REMAINING_MS) break;

    const timeout = isQuick ? 1 : Math.min(50, Math.floor(remainingMs / 1000) - 5);
    if (timeout < 1) break;

    const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout,
        allowed_updates: ['message'],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates = data.result ?? [];
    if (updates.length === 0) {
      if (isQuick) break;
      continue;
    }

    for (const update of updates) {
      if (!update.message?.text) continue;

      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const username = msg.from?.username || null;
      const firstName = msg.from?.first_name || null;

      // Handle /start command
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const role = (parts[1] === 'seller') ? 'seller' : 'blogger';

        // Generate auth code
        const code = generateCode();

        // Save code to DB
        const { error: insertErr } = await supabase
          .from('telegram_auth_codes')
          .insert({
            telegram_chat_id: chatId,
            telegram_username: username,
            telegram_first_name: firstName,
            code,
            role,
          });

        if (insertErr) {
          console.error('Failed to insert auth code:', insertErr);
          await sendMessage(chatId, '❌ Ошибка генерации кода. Попробуйте ещё раз.', LOVABLE_API_KEY, TELEGRAM_API_KEY);
        } else {
          const roleLabel = role === 'seller' ? 'Селлер' : 'Блогер';
          await sendMessage(
            chatId,
            `👋 Добро пожаловать в <b>DealLink</b>!\n\n` +
            `Ваш код для входа: <code>${code}</code>\n\n` +
            `Роль: <b>${roleLabel}</b>\n\n` +
            `Введите этот код на сайте для авторизации.`,
            LOVABLE_API_KEY,
            TELEGRAM_API_KEY,
          );
        }
      }

      totalProcessed++;
    }

    // Store raw messages
    const rows = updates
      .filter((u: any) => u.message)
      .map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message.chat.id,
        text: u.message.text ?? null,
        raw_update: u,
      }));

    if (rows.length > 0) {
      await supabase
        .from('telegram_messages')
        .upsert(rows, { onConflict: 'update_id' });
    }

    // Advance offset
    const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
    await supabase
      .from('telegram_bot_state')
      .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
      .eq('id', 1);

    currentOffset = newOffset;

    if (isQuick) break;
  }

  return new Response(JSON.stringify({ ok: true, processed: totalProcessed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
