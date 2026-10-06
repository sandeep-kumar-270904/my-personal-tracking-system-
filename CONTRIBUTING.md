# Contributing to StudentTracker OS

First off, thank you for considering contributing to StudentTracker OS! It's people like you that make the open-source community such an incredible place to learn and build.

To ensure the repository maintains FAANG-level engineering standards, all contributors must strictly adhere to the following guidelines.

## 1. Branch Naming Conventions
Never commit directly to `main`. Always create a new branch from `main`. Use the following prefixes to classify your branch:
- `feat/`: For new features (e.g., `feat/add-redis-caching`)
- `fix/`: For bug fixes (e.g., `fix/jwt-token-expiration`)
- `docs/`: For documentation updates (e.g., `docs/update-architecture-diagrams`)
- `refactor/`: For code refactoring without feature changes (e.g., `refactor/extract-nlp-service`)
- `test/`: For adding missing tests (e.g., `test/jest-auth-coverage`)

## 2. Conventional Commits
Your commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
**Format:** `<type>(<scope>): <subject>`
**Examples:**
- `feat(api): add concurrent SMTP dispatch via Promise.allSettled`
- `fix(ui): resolve Kanban drag-and-drop state mutation bug`
- `docs(readme): update C4 system architecture diagrams`

## 3. Pull Request Process
1. **Sync with Main:** Ensure your branch is rebased against the latest `main` branch.
2. **Run Tests:** Run `npm test` locally. Your PR will be automatically rejected by GitHub Actions if tests fail.
3. **Template:** Fill out the `.github/PULL_REQUEST_TEMPLATE.md` comprehensively.
4. **Review:** Request a review from the repository maintainers. Do not merge your own PR.

## 4. Local Development Setup
```bash
# 1. Fork and Clone
git clone https://github.com/YOUR_USERNAME/my-personal-tracking-system-.git
cd my-personal-tracking-system-

# 2. Setup API
cd server
npm install
# Create .env with MONGODB_URI and JWT_SECRET
npm run dev

# 3. Setup Client
cd ../client
npm install
npm run dev
```
