#!/usr/bin/env bash
API="http://localhost:8000"
EMAIL="probe-$(date +%s)@example.com"
echo "POST /api/auth/register"
curl -s -w "\n[status=%{http_code}]\n" -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"Probe User\",
    \"password\": \"senha-segura-12345\",
    \"phone\": \"(53) 99999-0000\",
    \"consent_terms\": true,
    \"consent_privacy\": true,
    \"consent_marketing\": true,
    \"consent_analytics\": false
  }"
