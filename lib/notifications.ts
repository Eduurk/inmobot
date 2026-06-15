type LeadData = {
  inmoNombre: string
  ownerEmail: string | null
  ownerWhatsapp: string | null
  leadNombre: string
  leadTelefono: string
  consulta: string
}

function emailHtml(d: LeadData) {
  const waLink = d.ownerWhatsapp
    ? `https://wa.me/${d.ownerWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${d.leadNombre}, te contacto desde ${d.inmoNombre} por tu consulta sobre propiedades.`)}`
    : null

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#1a1612;border-radius:16px;overflow:hidden;">

    <div style="background:#c4943a;padding:24px 32px;text-align:center;">
      <p style="margin:0;font-size:32px;">🏠</p>
      <h1 style="margin:8px 0 4px;color:#1a1612;font-size:22px;font-weight:800;">Nuevo lead capturado</h1>
      <p style="margin:0;color:#1a1612;opacity:0.7;font-size:14px;">${d.inmoNombre} · InmoBot IA</p>
    </div>

    <div style="padding:28px 32px;">
      <div style="background:#f5f0e8;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px;width:90px;">Nombre</td>
            <td style="padding:6px 0;color:#1a1612;font-weight:700;font-size:15px;">${d.leadNombre}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px;">Teléfono</td>
            <td style="padding:6px 0;color:#1a1612;font-weight:700;font-size:15px;">${d.leadTelefono}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#888;font-size:13px;vertical-align:top;">Consulta</td>
            <td style="padding:6px 0;color:#555;font-size:13px;line-height:1.5;">${d.consulta}</td>
          </tr>
        </table>
      </div>

      ${waLink ? `
      <a href="${waLink}" style="display:block;background:#25d366;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:50px;font-weight:700;font-size:15px;margin-bottom:12px;">
        📱 Contactar por WhatsApp
      </a>` : ''}

      <a href="tel:${d.leadTelefono}" style="display:block;background:#f5f0e8;color:#1a1612;text-decoration:none;text-align:center;padding:14px;border-radius:50px;font-weight:600;font-size:14px;">
        📞 Llamar al ${d.leadTelefono}
      </a>
    </div>

    <div style="padding:16px 32px;text-align:center;border-top:1px solid #2a2420;">
      <p style="margin:0;color:#666;font-size:12px;">InmoBot IA · Este lead fue capturado automáticamente por el chatbot</p>
    </div>
  </div>
</body>
</html>`
}

async function sendEmail(d: LeadData) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !d.ownerEmail) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'InmoBot <onboarding@resend.dev>',
      to: [d.ownerEmail],
      subject: `🏠 Nuevo lead: ${d.leadNombre} — ${d.inmoNombre}`,
      html: emailHtml(d),
    }),
  })
}

async function sendWhatsApp(d: LeadData) {
  const apiKey = process.env.CALLMEBOT_API_KEY
  const phone = process.env.CALLMEBOT_PHONE
  if (!apiKey || !phone) return

  const text = `🏠 *${d.inmoNombre} — Nuevo lead*\n\n👤 *${d.leadNombre}*\n📞 ${d.leadTelefono}\n💬 ${d.consulta.slice(0, 150)}${d.consulta.length > 150 ? '...' : ''}`

  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apiKey}`
  await fetch(url)
}

export async function notifyNewLead(d: LeadData) {
  await Promise.allSettled([sendEmail(d), sendWhatsApp(d)])
}
