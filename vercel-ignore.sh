CHANGED_FILES=$(git diff --name-only HEAD^ HEAD)

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

if echo "$CHANGED_FILES" | grep -qvE '(^\.github/|^\.husky/|\.md$|\.test\.[jt]sx?$)'; then
  exit 1
else
  exit 0
fi