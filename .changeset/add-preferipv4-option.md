---
"@centralinc/browseragent": minor
---

feat: Add preferIPv4 option to resolve Tailscale/VPN IPv6 connectivity issues

- Add `preferIPv4` option to `RetryConfig` interface (renamed from `forceIPv4`)
- Implement IPv4-only DNS resolution using custom HTTP agents
- Fix `ENETUNREACH` errors when IPv6 addresses can't be reached on VPN networks
- Clean implementation without global environment variable modifications
- Update documentation with Tailscale/VPN usage guidance
- Add comprehensive example demonstrating retry configuration with IPv4 preference
