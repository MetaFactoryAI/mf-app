#!/bin/bash
set -e
set -o allexport
# shellcheck source=../.env
source .env
set +o allexport

GEN_PATH=./shopify/__generated__

function generate() {
  # use the first argument as the path to move files to
  local GEN_PATH=$1; shift

  test -d "$GEN_PATH" && rm -r "$GEN_PATH"

  # pass the rest of the arguments to zeus
  (set -x; zeus "$SHOPIFY_API_URL" "$GEN_PATH" --node --ts "$@")

  # shamelessly borrowed from
  # https://gist.github.com/maxpoletaev/4ed25183427a2cd7e57a
  case "$OSTYPE" in
    darwin*)  PLATFORM="OSX" ;;
    linux*)   PLATFORM="LINUX" ;;
    bsd*)     PLATFORM="BSD" ;;
    *)        PLATFORM="UNKNOWN" ;;
  esac
  # mac sed needs sed -i '' -e
  # for other seds try removing -i '' -e
  # use `brew install gsed` on macos to get this
#  if [[ "$PLATFORM" == "OSX" || "$PLATFORM" == "BSD" ]]; then
#    sed -i "" 's,bigint"]:any,bigint"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i "" 's,bigint"]:unknown,bigint"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i "" 's,numeric"]:any,numeric"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i "" 's,numeric"]:unknown,numeric"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i "" 's,T extends keyof ResolverInputTypes,T extends keyof ModelTypes,g' "$GEN_PATH"/zeus/index.ts
#  elif [ "$PLATFORM" == "LINUX" ]; then
#    sed -i 's,bigint"]:any,bigint"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i 's,bigint"]:unknown,bigint"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i 's,numeric"]:any,numeric"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i 's,numeric"]:unknown,numeric"]:number,g' "$GEN_PATH"/zeus/index.ts
#    sed -i "" 's,T extends keyof ResolverInputTypes,T extends keyof ModelTypes,g' "$GEN_PATH"/zeus/index.ts
#  else
#    echo "unknown platform; exiting"
#    exit 1
#  fi
}

generate "$GEN_PATH" -h X-Shopify-Access-Token:"$SHOPIFY_API_TOKEN"
#generate $GEN_PATH -h x-hasura-role:user -h "authorization:generate"

# fix formatting of generated files
#../../node_modules/.bin/prettier --write $GEN_PATH
