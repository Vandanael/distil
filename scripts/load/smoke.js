// k6 smoke test : verifie que les endpoints publics repondent sous charge minimale.
// Usage :
//   k6 run scripts/load/smoke.js
//   BASE_URL=https://distil.app k6 run scripts/load/smoke.js
//
// Cible : 1 VU pendant 30s. Echec si p95 > 1000ms ou taux d'erreur > 1%.

import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function smoke() {
  const home = http.get(`${BASE_URL}/`)
  check(home, {
    'home 200': (r) => r.status === 200,
  })

  const login = http.get(`${BASE_URL}/login`)
  check(login, {
    'login 200 ou 301': (r) => r.status === 200 || r.status === 301 || r.status === 307,
  })

  sleep(1)
}
