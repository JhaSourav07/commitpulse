# 🔐 Security Policy

## 📢 Reporting a Vulnerability

We take the security of CommitPulse seriously. If you discover a vulnerability, please report it responsibly.

- Please contact maintainers via GitHub (preferred)

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if possible)

⚠️ Please do NOT create public issues for security vulnerabilities.

---

## 🛡️ Supported Versions

We aim to support the latest version of CommitPulse.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

---

## 🔒 Security Best Practices

To keep your usage secure:

- Always install from trusted sources
- Avoid running the tool on untrusted repositories
- Keep your dependencies updated
- Do not expose sensitive tokens or credentials
- **GitHub Token Scope**: CommitPulse requires `read:user` scope ONLY for reading user profile and contribution activity. No write permissions or repository access are required.
- **Fine-Grained PAT Recommendation for Self-Hosters**: Self-hosters are strongly advised to use a GitHub fine-grained Personal Access Token (PAT) restricted strictly to read-only public profile access, rather than a classic PAT with broad scopes.

---

## 🔐 Data & Privacy

CommitPulse is designed with privacy in mind:

- No source code is uploaded or stored
- Only Git metadata is analyzed
- Local analysis mode ensures full control over your data

---

## ⚙️ Responsible Disclosure

We appreciate responsible disclosure and will:

- Respond within 48–72 hours
- Investigate and fix issues promptly
- Credit contributors (if desired)

---

## 🙏 Acknowledgements

Thanks to all contributors who help keep CommitPulse secure.
