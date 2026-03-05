export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);

  const referralCode = params.code;               // /r/:code
  const biteId = url.searchParams.get("bite") || "";

  // Read or set device cookie (unique-per-device)
  const cookieHeader = request.headers.get("Cookie") || "";
  let deviceId = readCookie(cookieHeader, "ub_device_id");
  const isNewDevice = !deviceId;
  if (!deviceId) deviceId = crypto.randomUUID();

  // Call Supabase RPC (anon)
  const rpcUrl = `${env.SUPABASE_URL}/rest/v1/rpc/apply_link_click_reward`;
  try {
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
        p_bite_id: biteId || null,
      }),
    });
  } catch (_) {}

  // Deep link
  const deepLink =
    `popbite://referral?code=${encodeURIComponent(referralCode)}` +
    `&bite=${encodeURIComponent(biteId)}`;

  // Fallback to website
  const fallbackUrl = `https://unibite.app/?ref=${encodeURIComponent(referralCode)}`;

  // HTML that tries app then falls back
  const html = buildHtml(deepLink, fallbackUrl);

  const response = new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });

  if (isNewDevice) {
    response.headers.append(
      "Set-Cookie",
      `ub_device_id=${deviceId}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    );
  }

  return response;
}

function readCookie(cookieHeader, name) {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHtml(deepLink, fallbackUrl) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Opening PopBite…</title>
</head>
<body style="font-family: system-ui; padding: 24px;">
  <h3>Opening PopBite…</h3>
  <p>If nothing happens, tap below:</p>
  <p><a href="${deepLink}">Open PopBite</a></p>
  <p><a href="${fallbackUrl}">Continue on the web</a></p>

  <script>
    (function() {
      var deep = ${JSON.stringify(deepLink)};
      var fallback = ${JSON.stringify(fallbackUrl)};
      var start = Date.now();

      window.location.href = deep;

      setTimeout(function() {
        if (Date.now() - start < 2200) {
          window.location.href = fallback;
        }
      }, 1200);
    })();
  </script>
</body>
</html>`;
}
