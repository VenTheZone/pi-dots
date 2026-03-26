import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const QWEN_CREDENTIALS_PATH = join(homedir(), ".qwen/oauth_creds.json");

export function createQwenOAuthConfig(displayName: string) {
  return {
    name: `${displayName} (Qwen OAuth)`,
    async login(callbacks: any): Promise<any> {
      // Check if Qwen credentials already exist
      if (existsSync(QWEN_CREDENTIALS_PATH)) {
        try {
          const creds = JSON.parse(readFileSync(QWEN_CREDENTIALS_PATH, "utf8"));
          if (creds.access_token && creds.expiry_date) {
            const expires = new Date(creds.expiry_date).getTime();
            return {
              access: creds.access_token,
              refresh: creds.refresh_token || "",
              expires
            };
          }
        } catch (e) {
          // Invalid file, fall through to instructions
        }
      }

      // Show clear instructions to authenticate via Qwen CLI
      callbacks.onAuth({
        url: "https://chat.qwen.ai/",
        instructions: `
╔══════════════════════════════════════════════════════════════════╗
║              Qwen OAuth Authentication Required                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Qwen provides FREE models (2000 requests/day):                 ║
║  • qwen3-coder-plus (1M context)                                ║
║  • qwen3-coder-flash (1M context)                               ║
║                                                                  ║
║  To authenticate:                                               ║
║                                                                  ║
║  1. Install Qwen CLI:                                           ║
║     npm install -g @qwen-code/qwen-code                         ║
║                                                                  ║
║  2. Run Qwen and authenticate:                                  ║
║     qwen                                                        ║
║                                                                  ║
║  3. Select "Qwen OAuth" and complete browser login             ║
║                                                                  ║
║  Credentials are saved to:                                       ║
║  ~/.qwen/oauth_creds.json                                       ║
║                                                                  ║
║  After authenticating, retry the /login command.               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`
      });

      // Wait for user to potentially authenticate
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Try reading credentials again
      if (existsSync(QWEN_CREDENTIALS_PATH)) {
        try {
          const creds = JSON.parse(readFileSync(QWEN_CREDENTIALS_PATH, "utf8"));
          if (creds.access_token && creds.expiry_date) {
            const expires = new Date(creds.expiry_date).getTime();
            return {
              access: creds.access_token,
              refresh: creds.refresh_token || "",
              expires
            };
          }
        } catch (e) {}
      }

      throw new Error("Qwen authentication required. Install Qwen CLI and run 'qwen' to authenticate.");
    },

    async refreshToken(credentials: any): Promise<any> {
      if (!existsSync(QWEN_CREDENTIALS_PATH)) {
        throw new Error("Qwen credentials not found. Run 'qwen' CLI to re-authenticate.");
      }

      try {
        const creds = JSON.parse(readFileSync(QWEN_CREDENTIALS_PATH, "utf8"));
        const expires = creds.expiry_date ? new Date(creds.expiry_date).getTime() : 0;

        if (expires > Date.now()) {
          return {
            access: creds.access_token,
            refresh: creds.refresh_token || "",
            expires
          };
        }

        throw new Error("Qwen token expired. Please run 'qwen' CLI to re-authenticate.");
      } catch (e) {
        throw new Error("Cannot read Qwen credentials. Run 'qwen' CLI to re-authenticate.");
      }
    },

    getApiKey(credentials: any): string {
      return credentials.access;
    }
  };
}