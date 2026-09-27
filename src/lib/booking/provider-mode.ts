/** Configuration checks only; provider credentials still require a real connection check. */
export function hasLiveProviderConfiguration(config: {
  stripeSecretKey?: string;
  stripePublishableKey?: string;
  docusignOauthBaseUrl: string;
  docusignBaseUrl: string;
}): boolean {
  if (!/^(?:sk|rk)_live_\S+$/.test(config.stripeSecretKey ?? "") ||
      !/^pk_live_\S+$/.test(config.stripePublishableKey ?? "")) return false;

  try {
    const oauth = new URL(config.docusignOauthBaseUrl);
    const api = new URL(config.docusignBaseUrl);
    return oauth.href === "https://account.docusign.com/" &&
      api.protocol === "https:" &&
      /^[a-z0-9-]+\.docusign\.net$/.test(api.hostname) &&
      api.hostname !== "demo.docusign.net" &&
      api.pathname === "/restapi" &&
      !api.port && !api.username && !api.password && !api.search && !api.hash;
  } catch {
    return false;
  }
}
