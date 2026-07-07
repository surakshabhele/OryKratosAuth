#!/bin/sh

set -eu

MODE="${1:-serve}"

PROVIDERS_FILE=/tmp/kratos.oidc.providers.yml
OIDC_ENABLED=false
SMTP_ENABLED=false
OIDC_PROVIDERS=""

if [ -n "${GOOGLE_CLIENT_ID:-}" ] || [ -n "${GOOGLE_CLIENT_SECRET:-}" ]; then
  if [ -z "${GOOGLE_CLIENT_ID:-}" ]; then
    echo "GOOGLE_CLIENT_ID is required when enabling Google OIDC" >&2
    exit 1
  fi

  if [ -z "${GOOGLE_CLIENT_SECRET:-}" ]; then
    echo "GOOGLE_CLIENT_SECRET is required when enabling Google OIDC" >&2
    exit 1
  fi

  OIDC_ENABLED=true
  OIDC_PROVIDERS=$(cat <<EOF
          - id: google
            provider: google
            client_id: ${GOOGLE_CLIENT_ID}
            client_secret: ${GOOGLE_CLIENT_SECRET}
            issuer_url: https://accounts.google.com
            mapper_url: file:///etc/config/kratos/google.mapper.jsonnet
            scope:
              - openid
              - email
              - profile
            requested_claims:
              id_token:
                email:
                  essential: true
                email_verified:
                  essential: true
                given_name:
                  essential: true
                family_name: null
EOF
)
fi

if [ -n "${GITHUB_CLIENT_ID:-}" ] || [ -n "${GITHUB_CLIENT_SECRET:-}" ]; then
  if [ -z "${GITHUB_CLIENT_ID:-}" ]; then
    echo "GITHUB_CLIENT_ID is required when enabling GitHub OIDC" >&2
    exit 1
  fi

  if [ -z "${GITHUB_CLIENT_SECRET:-}" ]; then
    echo "GITHUB_CLIENT_SECRET is required when enabling GitHub OIDC" >&2
    exit 1
  fi

  OIDC_ENABLED=true
  OIDC_PROVIDERS="${OIDC_PROVIDERS}
          - id: github
            provider: github
            client_id: ${GITHUB_CLIENT_ID}
            client_secret: ${GITHUB_CLIENT_SECRET}
            mapper_url: file:///etc/config/kratos/github.mapper.jsonnet
            scope:
              - user:email
"
fi

printf '%s\n' "$OIDC_PROVIDERS" > "$PROVIDERS_FILE"

if [ "$OIDC_ENABLED" = true ]; then
  OIDC_METHOD=$(cat <<EOF
    oidc:
      enabled: true
      config:
        providers:
EOF
)
else
  OIDC_METHOD=$(cat <<EOF
    oidc:
      enabled: false
EOF
)
fi

if [ -n "${SMTP_CONNECTION_URI:-}" ]; then
  SMTP_ENABLED=true
  RECOVERY_FLOW=$(cat <<EOF
    recovery:
      enabled: true
      ui_url: http://127.0.0.1:4455/forgot-password
      use: code
EOF
)
  VERIFICATION_FLOW=$(cat <<EOF
    verification:
      enabled: true
      ui_url: http://127.0.0.1:4455/verify-email
      use: code
      after:
        default_browser_return_url: http://127.0.0.1:4455/login
EOF
)
  COURIER_CONFIG=$(cat <<EOF
  smtp:
    connection_uri: ${SMTP_CONNECTION_URI}
EOF
)
else
  RECOVERY_FLOW=$(cat <<EOF
    recovery:
      enabled: false
EOF
)
  VERIFICATION_FLOW=$(cat <<EOF
    verification:
      enabled: false
EOF
)
  COURIER_CONFIG=$(cat <<EOF
  smtp: {}
EOF
)
fi

# Render the runtime config from the checked-in template so secrets stay out of git.
awk \
  -v providers_file="$PROVIDERS_FILE" \
  -v oidc_method="$OIDC_METHOD" \
  -v recovery_flow="$RECOVERY_FLOW" \
  -v verification_flow="$VERIFICATION_FLOW" \
  -v courier_config="$COURIER_CONFIG" '
  $0 == "__OIDC_METHOD__" {
    print oidc_method
    while ((getline line < providers_file) > 0) {
      if (length(line) > 0) {
        print line
      }
    }
    close(providers_file)
    next
  }
  $0 == "__RECOVERY_FLOW__" {
    print recovery_flow
    next
  }
  $0 == "__VERIFICATION_FLOW__" {
    print verification_flow
    next
  }
  $0 == "__COURIER_CONFIG__" {
    print courier_config
    next
  }
  { print }
' /etc/config/kratos/kratos.yml > /tmp/kratos.rendered.yml

case "$MODE" in
  serve)
    exec kratos serve -c /tmp/kratos.rendered.yml --dev
    ;;
  courier)
    if [ "$SMTP_ENABLED" != true ]; then
      echo "SMTP_CONNECTION_URI not set; courier is idle because recovery and verification are disabled."
      exec tail -f /dev/null
    fi
    exec kratos courier watch -c /tmp/kratos.rendered.yml
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac
