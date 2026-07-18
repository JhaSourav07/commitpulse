# Handle initial commits and shallow clones
if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  exit 1
fi

CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

if echo "$CHANGED_FILES" | grep -qvE '(^\.github/|^\.husky/|^locales/|^vercel-ignore\.sh$|\.md$|\.test\.[jt]sx?$)'; then
  exit 1
else
  exit 0
fi