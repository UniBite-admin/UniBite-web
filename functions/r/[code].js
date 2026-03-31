/**
 * Cloudflare Pages Function for /r/<code>?bite=<id>
 * 
 * Responsibilities:
 * 1. Log referral click via Supabase RPC
 * 2. Maintain device_id for reward logic
 * 3. Serve the shared-bite.html landing page ALWAYS
 *    (Auto-open app will be handled later via Android App Links)
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // -------------------------------
  // Extract referral code + bite ID
  // -------------------------------
  const referralCode = params.code;
  const biteId = url.searchParams.get("bite") || null;

  // -------------------------------
  // Device ID cookie (reward system)
  // -------------------------------
  const cookieHeader = request.headers.get("Cookie") || "";
  let deviceId = readCookie(cookieHeader, "ub_device_id");
  const isNewDevice = !deviceId;

  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  // -------------------------------
  // Trigger Supabase RPC (reward logic)
  // -------------------------------
  try {
    const rpcUrl = `${env.SUPABASE_URL}/rest/v1/rpc/apply_link_click_reward`;

    await fetch(rpcUrl, {
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
    console.log("RPC error:", e);
  }

  // -------------------------------
  // Serve shared-bite.html ALWAYS
  // -------------------------------
  const landing = await context.env.ASSETS.fetch(
    new URL("/shared-bite.html", request.url)
  );

  const response = new Response(landing.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });

  // -------------------------------
  // Set device cookie if new
  // -------------------------------
  if (isNewDevice) {
    response.headers.append(
      "Set-Cookie",
      `ub_device_id=${deviceId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    );
  }

  return response;
}

// -------------------------------
// Cookie reader
// -------------------------------
function readCookie(cookieHeader, name) {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
