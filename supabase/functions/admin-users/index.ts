// ══════════════════════════════════════════════════
//  SAFARI ASAP — admin-users Edge Function
//  Lets a super-admin create / delete / reset-password
//  other users. Holds the service_role key server-side
//  (NEVER put that key in the browser).
//
//  Deploy:
//    supabase functions deploy admin-users
//  Supabase automatically injects SUPABASE_URL, SUPABASE_ANON_KEY and
//  SUPABASE_SERVICE_ROLE_KEY into deployed functions, so no extra secret
//  is normally needed. (If your project blocks the auto key, set your own:
//    supabase secrets set SERVICE_ROLE_KEY=<your-service-role-key>)
// ══════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Supabase reserves the SUPABASE_ prefix for secrets, so we use our own name.
const SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Decode a JWT's payload and return its `sub` (the user id).
// The signature is already verified by the Supabase platform.
function decodeJwtSub(jwt: string): string | null {
  try {
    let payload = jwt.split(".")[1];
    if (!payload) return null;
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) payload += "=".repeat(4 - pad);
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Identify the caller from their JWT ──
    // Supabase verifies the JWT signature *before* this function runs
    // (Verify JWT is enabled by default), so the token is already trusted.
    // We just decode the `sub` claim to learn who the caller is. This works
    // with both legacy HS256 and the newer ES256 asymmetric signing keys.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Missing authorization." }, 401);

    const callerId = decodeJwtSub(token);
    if (!callerId) {
      return json({ error: "Could not read user from token." }, 401);
    }

    // ── Service-role client (full privileges) ──
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Verify the caller is an active super-admin ──
    const { data: profile, error: profileErr } = await admin
      .from("admin_profiles")
      .select("role, is_active")
      .eq("id", callerId)
      .maybeSingle();
    if (profileErr) {
      return json({ error: "Profile lookup failed: " + profileErr.message }, 500);
    }
    if (!profile || profile.role !== "super_admin" || profile.is_active === false) {
      return json({ error: "Forbidden: super-admin only." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ── CREATE USER ──
    if (action === "create") {
      const { username, email, password, role } = body;
      if (!email || !password) {
        return json({ error: "Email and password are required." }, 400);
      }
      if (String(password).length < 6) {
        return json({ error: "Password must be at least 6 characters." }, 400);
      }
      const newRole = role === "super_admin" ? "super_admin" : "editor";

      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // usable immediately, no confirmation email
          user_metadata: { username: username || "" },
        });
      if (createErr) return json({ error: createErr.message }, 400);

      const { error: profErr } = await admin.from("admin_profiles").insert({
        id: created.user.id,
        email,
        username: username || email.split("@")[0],
        role: newRole,
        is_active: true,
      });
      if (profErr) {
        // Roll back the auth user so we don't leave an orphan.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "Profile creation failed: " + profErr.message }, 400);
      }
      return json({ ok: true, id: created.user.id });
    }

    // ── DELETE USER ──
    if (action === "delete") {
      const { id } = body;
      if (!id) return json({ error: "User id is required." }, 400);
      if (id === callerId) {
        return json({ error: "You cannot delete your own account." }, 400);
      }
      const { error: delErr } = await admin.auth.admin.deleteUser(id);
      if (delErr) return json({ error: delErr.message }, 400);
      // admin_profiles row is removed automatically (ON DELETE CASCADE).
      return json({ ok: true });
    }

    // ── RESET PASSWORD ──
    if (action === "reset_password") {
      const { id, password } = body;
      if (!id || !password) {
        return json({ error: "User id and password are required." }, 400);
      }
      if (String(password).length < 6) {
        return json({ error: "Password must be at least 6 characters." }, 400);
      }
      const { error: updErr } = await admin.auth.admin.updateUserById(id, {
        password,
      });
      if (updErr) return json({ error: updErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message ?? "Unexpected error." }, 500);
  }
});
