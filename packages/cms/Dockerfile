FROM directus/directus:9.12.1

ARG OIDC_CLIENT_ID
ARG OIDC_CLIENT_SECRET
ARG OIDC_ISSUER_URL

# Cache Settings
ENV AUTH_PROVIDERS 'ethereum'
ENV AUTH_ETHEREUM_DRIVER 'openid'
ENV AUTH_ETHEREUM_SCOPE 'openid profile'
ENV AUTH_ETHEREUM_IDENTIFIER_KEY 'sub'
ENV AUTH_ETHEREUM_ICON 'key'
ENV AUTH_ETHEREUM_ALLOW_PUBLIC_REGISTRATION true
ENV AUTH_ETHEREUM_CLIENT_ID $OIDC_CLIENT_ID
ENV AUTH_ETHEREUM_CLIENT_SECRET $OIDC_CLIENT_SECRET
ENV AUTH_ETHEREUM_ISSUER_URL $OIDC_ISSUER_URL

COPY extensions /directus/extensions
COPY uploads /directus/uploads
COPY snapshot.yaml /directus/snapshot.yaml

CMD npx directus bootstrap && npx directus schema apply --yes ./snapshot.yaml && npx directus start
