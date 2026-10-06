# Security Policy

## Supported Versions

Security updates are provided for the latest major version of the repository.

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

At StudentTracker OS, we take the security of candidate data and our infrastructure incredibly seriously. We adhere to FAANG-standard responsible disclosure practices.

If you discover a security vulnerability (e.g., NoSQL Injection bypass, JWT signature forgery, XSS within the React SPA, or unauthorized access to the Gemini API layer), please **DO NOT** open a public issue.

Instead, please email the vulnerability details to **security@studenttracker.com** (replace with your actual security contact).

### What to Include in Your Report:
- A detailed description of the vulnerability.
- Steps to reproduce the issue (including any cURL commands, payload scripts, or UI steps).
- The potential impact (e.g., Data exfiltration, privilege escalation).

### Triage Process
1. We will acknowledge receipt of your vulnerability report within 48 hours.
2. We will attempt to reproduce the vulnerability within 72 hours.
3. If confirmed, we will issue a CVE patch in our private fork and merge it into `main` before notifying the community of the patch.
