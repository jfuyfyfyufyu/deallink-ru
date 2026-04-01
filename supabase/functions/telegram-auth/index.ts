import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let code: string;
  try {
    const body = await req.json();
    code = String(body.code || '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!code || code.length !== 6) {
    return new Response(JSON.stringify({ error: 'Код должен быть 6-значным' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Admin bypass code
  const ADMIN_CODE = '666661';
  if (code === ADMIN_CODE) {
    // Find admin user and generate session directly
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminProfile) {
      return new Response(JSON.stringify({ error: 'Админ не найден' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get admin email
    const { data: adminUser } = await supabase.auth.admin.getUserById(adminProfile.user_id);
    if (!adminUser?.user?.email) {
      return new Response(JSON.stringify({ error: 'Ошибка получения админа' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: adminUser.user.email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('Admin link error:', linkErr);
      return new Response(JSON.stringify({ error: 'Ошибка генерации сессии' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });

    if (verifyErr || !verifyData.session) {
      console.error('Admin verify error:', verifyErr);
      return new Response(JSON.stringify({ error: 'Ошибка верификации' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      access_token: verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Find unused code created in the last 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: authCode, error: findErr } = await supabase
    .from('telegram_auth_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .gte('created_at', tenMinAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (findErr || !authCode) {
    return new Response(JSON.stringify({ error: 'Неверный или просроченный код' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Mark code as used
  await supabase
    .from('telegram_auth_codes')
    .update({ used: true })
    .eq('id', authCode.id);

  const telegramId = String(authCode.telegram_chat_id);
  const role = authCode.role || 'blogger';
  const name = authCode.telegram_first_name || authCode.telegram_username || `User_${telegramId}`;

  // Check if user with this telegram_id exists in profiles
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single();

  let userId: string;

  if (existingProfile) {
    userId = existingProfile.user_id;
  } else {
    // Create a new auth user
    const email = `tg_${telegramId}@deallink.app`;
    const password = crypto.randomUUID();

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, telegram_id: telegramId },
    });

    if (createErr || !newUser.user) {
      console.error('Failed to create user:', createErr);
      return new Response(JSON.stringify({ error: 'Ошибка создания пользователя' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    userId = newUser.user.id;

    // Update the auto-created profile with telegram info and role
    await supabase
      .from('profiles')
      .update({
        name,
        telegram_id: telegramId,
        role: role as any,
      })
      .eq('user_id', userId);

    // Update user_roles
    await supabase
      .from('user_roles')
      .update({ role: role as any })
      .eq('user_id', userId);
  }

  // Generate a session for the user
  // Use admin to generate link, then extract token
  const { data: sessionData, error: sessionErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: `tg_${telegramId}@deallink.app`,
  });

  if (sessionErr || !sessionData) {
    console.error('Failed to generate link:', sessionErr);
    return new Response(JSON.stringify({ error: 'Ошибка генерации сессии' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Use the token to verify OTP and get a session
  const token_hash = sessionData.properties?.hashed_token;
  
  if (!token_hash) {
    console.error('No hashed_token in response');
    return new Response(JSON.stringify({ error: 'Ошибка генерации токена' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash,
  });

  if (verifyErr || !verifyData.session) {
    console.error('Failed to verify OTP:', verifyErr);
    return new Response(JSON.stringify({ error: 'Ошибка верификации' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    access_token: verifyData.session.access_token,
    refresh_token: verifyData.session.refresh_token,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
