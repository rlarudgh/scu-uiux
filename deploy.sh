#!/usr/bin/env bash
# 책갈피 검사·배포 스크립트
#
#   ./deploy.sh check            HTML·CSS·JS 검사만 실행 (CI도 이 명령을 사용)
#   ./deploy.sh "feat: 메시지"    검사 → 변경 파일 확인 → 커밋 → main에 push
#
# GitHub Pages가 main 브랜치에서 배포되므로 push하면 1~2분 뒤 사이트에 반영된다.

set -euo pipefail

SITE_URL="https://rlarudgh.github.io/scu-uiux/"
ACTIONS_URL="https://github.com/rlarudgh/scu-uiux/actions"
DEPLOY_BRANCH="main"

# 설정 파일 없이 실행. HTML·CSS는 W3C 공식 검사기(vnu, Java 필요), JS는 ESLint 규칙을 여기서 직접 지정
VNU="vnu-jar@26.10.12"
ESLINT="eslint@10.13.0"
JS_GLOBALS="window,document,location,history,localStorage,requestAnimationFrame,setTimeout"
JS_RULES=(
  "no-undef: error"
  "no-unused-vars: [error, {ignoreRestSiblings: true}]"
  "no-unreachable: error"
  "no-dupe-keys: error"
  "no-console: error"
  "no-eval: error"
  "eqeqeq: error"
)

cd "$(dirname "$0")"

lint() {
  echo "▶ HTML 검사 (W3C $VNU)"
  npx --yes "$VNU" --errors-only index.html
  echo "▶ CSS 검사 (W3C $VNU)"
  npx --yes "$VNU" --errors-only --css styles.css
  echo "▶ JS 검사 ($ESLINT)"
  local rule_args=()
  for rule in "${JS_RULES[@]}"; do rule_args+=(--rule "$rule"); done
  npx --yes "$ESLINT" --no-config-lookup --global "$JS_GLOBALS" "${rule_args[@]}" script.js
  echo "✓ 모든 검사 통과"
}

usage() {
  sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

[ $# -eq 1 ] || usage

if [ "$1" = "check" ]; then
  lint
  exit 0
fi

message="$1"

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ "$branch" != "$DEPLOY_BRANCH" ]; then
  echo "✗ 현재 브랜치는 '$branch'예요. '$DEPLOY_BRANCH'에서 실행해주세요." >&2
  exit 1
fi

lint

if [ -z "$(git status --porcelain)" ]; then
  echo "커밋할 변경 사항이 없어요. 아직 push하지 않은 커밋만 올립니다."
else
  echo
  echo "▶ 커밋할 변경 사항"
  git status --short
  echo
  read -r -p "위 파일을 모두 커밋하고 배포할까요? [y/N] " answer
  if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
    echo "취소했어요. 아무것도 커밋하지 않았습니다."
    exit 1
  fi
  git add -A
  git commit -m "$message"
fi

git pull --rebase origin "$DEPLOY_BRANCH"
git push origin "$DEPLOY_BRANCH"

echo
echo "✓ push 완료. 1~2분 뒤 사이트에 반영돼요."
echo "  사이트: $SITE_URL"
echo "  진행 상황: $ACTIONS_URL"
