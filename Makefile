.PHONY: bump-patch bump-minor bump-major publish help

help:
	@echo "Version bump targets:"
	@echo "  make bump-patch  - Bump patch version (0.5.6 -> 0.5.7)"
	@echo "  make bump-minor  - Bump minor version (0.5.6 -> 0.6.0)"
	@echo "  make bump-major  - Bump major version (0.5.6 -> 1.0.0)"
	@echo ""
	@echo "Publishing:"
	@echo "  make publish     - Publish extension to VS Code marketplace"

bump-patch:
	@echo "Bumping patch version..."
	npm version patch --no-git-tag-version
	@echo "Version bumped successfully!"
	@git diff package.json

bump-minor:
	@echo "Bumping minor version..."
	npm version minor --no-git-tag-version
	@echo "Version bumped successfully!"
	@git diff package.json

bump-major:
	@echo "Bumping major version..."
	npm version major --no-git-tag-version
	@echo "Version bumped successfully!"
	@git diff package.json

publish:
	@echo "Building extension..."
	npm run compile
	@echo "Publishing to VS Code marketplace..."
	vsce publish
	@echo "Published successfully!"
