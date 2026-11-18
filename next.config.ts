import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Le moteur d'écriture lit ses prompts et les plans des mondes au moment de l'exécution.
  outputFileTracingIncludes: {
    "/**": ["./prompts/**/*.md", "./specs/mondes-v0.md"],
  },
};

export default nextConfig;
