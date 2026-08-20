// Feature flag registry. Every enterprise surface is dark by default: a flag
// must default to OFF and only be flipped in production with
// `pm2 restart crm --update-env`.

export type FlagName =
  | 'WHITE_LABEL_ENABLED'
  | 'SAML_SP_ENABLED'
  | 'ALERTING_ENABLED';

export const FLAG_DEFAULTS: Record<FlagName, boolean> = {
  WHITE_LABEL_ENABLED: false,
  SAML_SP_ENABLED: false,
  ALERTING_ENABLED: false,
};

export function isEnabled(name: FlagName): boolean {
  const env = process.env[name];
  if (env === undefined) return FLAG_DEFAULTS[name];
  return env === 'true';
}
