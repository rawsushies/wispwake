# Security Policy

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `0.4.x` (Milestone 4) | :white_check_mark: |
| `< 0.4.0` | :x: |

## Security Architecture Notes

- **Zero Client Secrets**: **Wispwake** is a pure client-side 2D exploration platformer (`React 19 + Phaser 3`). It does not require API keys, authentication tokens, or external cloud databases to play.
- **Local Persistence Only**: Game progress, chapter unlocks, Wake Trials personal bests, and accessibility preferences are stored strictly in browser `localStorage` under `wispwake_save_v2` with schema validation and fallback protection.

## Reporting a Vulnerability

If you discover a security vulnerability in this repository or its dependencies, please report it privately via [GitHub Security Advisories](https://github.com/rawsushies/wispwake/security/advisories/new) rather than opening a public issue.
