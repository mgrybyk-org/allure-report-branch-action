TAG_MAJOR=v1
git tag --delete $TAG_MAJOR
git push --delete origin $TAG_MAJOR
git tag $TAG_MAJOR
git push --tags
