// k6 load test : 20 VUs en steady-state, rampe courte.
// Usage :
//   k6 run scripts/load/load.js
//
// Cible : p95 < 1500ms sur la home. Valide la scalabilite de Next + Netlify
// Edge en lecture seule. Les routes authentifiees ne sont PAS couvertes ici
// (necessite un token de session ; voir scripts/load/authed.js a ajouter si besoin).

import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.02'],
  },
}

export default function load() {
  const res = http.get(`${BASE_URL}/`)
  check(res, {
    'status 200': (r) => r.status === 200,
    'payload non vide': (r) => r.body && r.body.length > 0,
  })
  sleep(Math.random() * 2)
}
