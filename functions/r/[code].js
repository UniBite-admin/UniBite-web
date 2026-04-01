export async function onRequest(context) {
  const { request, params, env } = context;
  const url = new URL(request.url);

  const referralCode = params.code;
  const biteId = url.searchParams.get("bite") || null;

  // Device cookie logic
  const cookies = request.headers.get("Cookie") || "";
  let deviceId = readCookie(cookies, "ub_device_id");
  const isNewDevice = !deviceId;

  if (!deviceId) deviceId = crypto.randomUUID();

  // RPC call to Supabase
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/apply_link_click_reward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": env.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_referral_code: referralCode,
        p_device_id: deviceId,
        p_bite_id: biteId,
      }),
    });
  } catch (e) {
    console.error("Supabase RPC error:", e);
  }

  // Serve shared-bite.html ALWAYS (browser fallback)
  const landing = await context.env.ASSETS.fetch(
    new URL("/shared-bite.html", request.url)
  );

  const response = new Response(landing.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });

  if (isNewDevice) {
    response.headers.append(
      "Set-Cookie",
      `ub_device_id=${deviceId}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`
    );
  }

  return response;
}

function readCookie(header, name) {
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
