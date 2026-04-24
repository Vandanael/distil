function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type WelcomeData = {
  appUrl: string
  feedbackEmail: string
}

export function buildWelcomeHtml({ appUrl, feedbackEmail }: WelcomeData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bienvenue sur Distil</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3ed;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ed;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e0d8;padding:40px 32px;">
        <tr>
          <td style="border-bottom:2px solid #1a3a2e;padding-bottom:16px;margin-bottom:24px;">
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a3a2e;letter-spacing:-0.5px;">Distil</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:28px;">
            <p style="font-size:16px;line-height:1.6;color:#1a3a2e;margin:0 0 20px;">
              Ton profil est créé. Ta première édition t'attend.
            </p>
            <p style="font-size:15px;line-height:1.65;color:#587060;margin:0 0 24px;">
              Chaque matin, Distil te propose une sélection d'articles calibrée sur tes centres d'intérêt - essentiels et découvertes mêlés. L'algo s'affine à chaque geste.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border-left:3px solid #e2e0d8;padding-left:16px;">
              <tr><td style="font-size:14px;line-height:1.7;color:#587060;padding:2px 0;"><strong style="color:#1a3a2e;">Plus comme ça</strong> - cet angle t'intéresse, Distil en cherche d'autres.</td></tr>
              <tr><td style="font-size:14px;line-height:1.7;color:#587060;padding:2px 0;"><strong style="color:#1a3a2e;">Moins comme ça</strong> - ce sujet ne t'intéresse pas, l'algo s'ajuste.</td></tr>
              <tr><td style="font-size:14px;line-height:1.7;color:#587060;padding:2px 0;"><strong style="color:#1a3a2e;">À lire</strong> - l'article va dans ta pile, accessible depuis la bibliothèque.</td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td align="center">
                  <a href="${escapeHtml(appUrl)}/feed" style="display:inline-block;background-color:#1a3a2e;color:#f5f3ed;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:600;padding:12px 28px;letter-spacing:0.2px;">
                    Voir mon édition
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;line-height:1.65;color:#9aa89e;margin:0;border-top:1px solid #e2e0d8;padding-top:20px;">
              C'est une beta - il y aura des bugs. Si quelque chose coince, réponds directement à cet email ou écris à <a href="mailto:${escapeHtml(feedbackEmail)}" style="color:#587060;">${escapeHtml(feedbackEmail)}</a>. Tout retour compte.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function buildWelcomeText({ appUrl, feedbackEmail }: WelcomeData): string {
  return `Distil

Ton profil est créé. Ta première édition t'attend.

Chaque matin, Distil te propose une sélection d'articles calibrée sur tes centres d'intérêt.

3 gestes pour que l'algo apprenne vite :
- Plus comme ça : cet angle t'intéresse, Distil en cherche d'autres.
- Moins comme ça : ce sujet ne t'intéresse pas, l'algo s'ajuste.
- À lire : l'article va dans ta pile, accessible depuis la bibliothèque.

Voir mon édition : ${appUrl}/feed

---
C'est une beta - il y aura des bugs. Si quelque chose coince, réponds à cet email ou écris à ${feedbackEmail}.`
}
