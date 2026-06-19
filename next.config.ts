import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

process.env.SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING ??= "1";
process.env.PRISMA_DISABLE_WARNINGS ??= "1";

const useStandaloneOutput = process.env.NEXT_OUTPUT_MODE === "standalone";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: useStandaloneOutput ? "standalone" : undefined,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingExcludes: {
    "*": [
      "./documentacao/**/*",
      "./legislacao/**/*",
      "./boletins/**/*",
      "./CERTIFICADOS 2025/**/*",
      "./auditorias_documentos/**/*",
    ],
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./templates/**/*"],
  },
  async redirects() {
    return [
      {
        source: '/relatorios',
        destination: '/obras',
        permanent: true,
      },
    ];
  },
  typescript: { ignoreBuildErrors: true },

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

const hasSentryReleaseConfig = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
);

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    dryRun: !hasSentryReleaseConfig,
  },
  {
    hideSourceMaps: true,
    automaticVercelMonitors: true,
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
    },
  }
);
