// Génère le code bookmarklet à partir d'un token et d'une URL de base

export function generateBookmarkletCode(token: string, appBaseUrl: string): string {
  const apiUrl = `${appBaseUrl}/api/articles/save`

  // Script minifié - pas de template literals pour compatibilité maximale
  const script = [
    '(function(){',
    'fetch(' + JSON.stringify(apiUrl) + ',{',
    'method:"POST",',
    'headers:{"Content-Type":"application/json","Authorization":"Bearer ' + token + '"},',
    'body:JSON.stringify({url:location.href})',
    '}).then(function(r){return r.json()}).then(function(d){',
    'd.accepted',
    '?alert("Distil - Sauvegarde \\u2713 (score\u00a0: "+d.score+")")',
    ':alert("Distil - Rejete\u00a0: "+(d.rejectionReason||"hors profil"))',
    '}).catch(function(){alert("Distil - Erreur reseau")})',
    '})()',
  ].join('')

  return 'javascript:' + encodeURIComponent(script)
}
