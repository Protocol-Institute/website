// POST /api/auth/send-pin
// Body: { email: string }
// Generates a 6-digit PIN, stores bcrypt-like hash in D1, sends via Resend

const PIN_TTL_MINUTES = 15;

function generatePin() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const purpose = body.purpose || 'edit'; // 'edit' = members only; 'join' = any email

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }

  // For edit flow: silently skip if email not in members table (avoids enumeration)
  // For join flow: any email can request a PIN to verify ownership,
  //   except emails with a pending membership_request (show review message instead)
  let memberName = null;
  if (purpose === 'edit') {
    const member = await env.DB.prepare(
      'SELECT name FROM members WHERE email = ? AND is_public = 1'
    ).bind(email).first();
    if (!member) return Response.json({ ok: true });
    memberName = member.name;
  } else {
    // join flow: block if a pending application exists and not yet approved
    const isMember = await env.DB.prepare(
      'SELECT 1 FROM members WHERE email = ?'
    ).bind(email).first();
    if (!isMember) {
      const request = await env.DB.prepare(
        "SELECT status FROM membership_requests WHERE email = ?"
      ).bind(email).first();
      if (request && request.status === 'pending') {
        return Response.json({
          error: 'Your application is being reviewed. You will be notified by email when it is approved.',
        }, { status: 400 });
      }
    }
  }

  const pin = generatePin();
  const pinHash = await hashPin(pin);
  const expiresAt = new Date(Date.now() + PIN_TTL_MINUTES * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT OR REPLACE INTO auth_pins (email, pin_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(email, pinHash, expiresAt).run();

  // Send PIN via Resend
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Protocol Institute <noreply@protocol-institute.org>',
      to: [email],
      subject: 'Your Protocol Institute sign-in code',
      html: `<p>Hi${memberName ? ' ' + memberName.split(' ')[0] : ''},</p>
<p>Your sign-in code is: <strong style="font-size:1.4em;letter-spacing:0.1em">${pin}</strong></p>
<p>This code expires in ${PIN_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.</p>
<p>— Protocol Institute</p>`,
    }),
  });

  if (!resendRes.ok) {
    console.error('Resend error:', await resendRes.text());
    return Response.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
