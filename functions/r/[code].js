export async function onRequest(context) {
  const { request, params, env } = context;
  const url = new URL(request.url);

  const referralCode = params.code;
  const biteToken = url.searchParams.get("bite") || null;

  let popBiteId = null;

  // UUID detection
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  if (biteToken && uuidRegex.test(biteToken)) {
    // ✅ Resolve UUID → pop_bite_id
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/pb_profiles?select=pop_bite_id&profile_uuid=eq.${biteToken}`,
        {
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
        }
      );

      const rows = await res.json();
      popBiteId = rows?.[0]?.pop_bite_id ?? null;
    } catch (e) {
      console.error("UUID → pop_bite_id lookup failed", e);
    }
  } else {
    // ✅ Backward compatibility (old links)
    popBiteId = biteToken;
  }

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
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        p_referral_code: referralCode,
        p_device_id: deviceId,
        p_bite_id: popBiteId,
      }),
    });
  } catch (e) {
    console.error("Supabase RPC error:", e);
  }

  // ✅ Redirect browser to shared-bite.html with RESOLVED popBiteId
  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = "/shared-bite.html";

  if (popBiteId) {
    redirectUrl.searchParams.set("bite", popBiteId);
  } else {
    redirectUrl.searchParams.delete("bite");
  }

  // ✅ Create a mutable redirect response (safe for Pages Functions)
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
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
