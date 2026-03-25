import * as http from "node:http";
import * as url from "node:url";

const CLINE_API_BASE = "https://api.cline.bot/api/v1";

export function buildClineAuthHeaders(): Record<string, string> {
  return {
    "X-Platform": "Visual Studio Code",
    "X-Platform-Version": "1.109.3",
    "X-Client-Type": "VSCode Extension",
    "X-Client-Version": "3.63.0",
    "X-Core-Version": "3.63.0",
    "HTTP-Referer": "https://cline.bot",
    "X-Title": "Cline",
    "Accept": "application/json",
    "Content-Type": "application/json"
  };
}

export function createClineOAuthConfig(displayName: string) {
  return {
    name: displayName,
    async login(callbacks: any): Promise<any> {
      const serverPort = 31234;
      const callbackUrl = `http://127.0.0.1:${serverPort}/auth`;
      
      const authUrl = new URL(`${CLINE_API_BASE}/auth/authorize`);
      authUrl.searchParams.set("client_type", "extension");
      authUrl.searchParams.set("callback_url", callbackUrl);
      authUrl.searchParams.set("redirect_uri", callbackUrl);
      
      let finalAuthUrl = authUrl.toString();
      try {
          const response = await fetch(authUrl.toString(), {
              method: "GET",
              redirect: "manual",
              headers: buildClineAuthHeaders()
          });
          if (response.status >= 300 && response.status < 400) {
              const loc = response.headers.get("Location");
              if (loc) finalAuthUrl = loc;
          } else {
              const json = await response.json() as any;
              if (json.redirect_url) finalAuthUrl = json.redirect_url;
          }
      } catch (e) {}

      let server: http.Server | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      const closeCallbackServer = () => {
        if (server) {
          server.close();
          server = null;
        }
      };
      
      const codePromise = new Promise<{ code: string }>((resolve, reject) => {
        server = http.createServer((req, res) => {
          try {
            const reqUrl = new url.URL(req.url || "", `http://127.0.0.1:${serverPort}`);
            if (reqUrl.pathname === "/auth") {
              const code = reqUrl.searchParams.get("code");
              if (code) {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end("<!DOCTYPE html><html><body><h1>Authenticated</h1><p>You can close this window</p></body></html>");
                resolve({ code });
              } else {
                res.writeHead(400);
                res.end("Missing code");
                reject(new Error("Missing code"));
              }
            } else {
              res.writeHead(404);
              res.end("Not found");
            }
          } catch (e) {
            reject(e);
          } finally {
            closeCallbackServer();
            if (timeoutId) clearTimeout(timeoutId);
          }
        });
        
        server.on('error', (err: any) => {
          reject(new Error(`Server error: ${err.message}`));
        });
        
        server.listen(serverPort, "127.0.0.1");
        
        timeoutId = setTimeout(() => {
          closeCallbackServer();
          reject(new Error("TIMEOUT"));
        }, 5 * 60 * 1000);
      });

      callbacks.onAuth({ 
        url: finalAuthUrl,
        instructions: `
Cline Authentication
1. Open the URL above in your browser.
2. Complete the login.
3. If it fails to connect to localhost (e.g. over SSH), copy the callback URL from your browser's address bar.
4. Paste the full callback URL here, or just the "code" parameter.
`
      });
      
      try {
        let code: string;
        
        if (callbacks.onManualCodeInput) {
          const manualCodePromise = callbacks.onManualCodeInput();
          const result = await Promise.race([
            codePromise.then(r => ({ type: "local" as const, ...r })),
            manualCodePromise.then((c: string) => ({ type: "manual" as const, code: c }))
          ]);
          
          if (result.type === "local") {
            code = result.code;
          } else {
            closeCallbackServer();
            if (timeoutId) clearTimeout(timeoutId);
            
            code = result.code.trim();
            if (code.includes("code=")) {
              try {
                const manualUrl = new URL(code);
                const extracted = manualUrl.searchParams.get("code");
                if (extracted) code = extracted;
              } catch {}
            }
          }
        } else {
          const result = await codePromise;
          code = result.code;
        }

        if (!code) throw new Error("No code received");

        // Exchange code for token
        let tokenData: any = null;
        let lastExchangeError = "";
        
        // Try both providers for exchange
        for (const p of ["github", "google"]) {
          const exchangeRes = await fetch(`${CLINE_API_BASE}/auth/token`, {
            method: "POST",
            headers: buildClineAuthHeaders(),
            body: JSON.stringify({ code, provider: p })
          });
          if (!exchangeRes.ok) continue;
          const data = await exchangeRes.json() as any;
          if (data?.success && data?.data?.accessToken) {
            tokenData = data.data;
            break;
          }
        }

        if (!tokenData) throw new Error("Token exchange failed");

        return {
          access: `workos:${tokenData.accessToken}`,
          refresh: tokenData.refreshToken,
          expires: new Date(tokenData.expiresAt).getTime()
        };
      } catch (error) {
        closeCallbackServer();
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    },

    async refreshToken(credentials: any): Promise<any> {
      if (!credentials.refresh) throw new Error("No refresh token available. Please sign in again.");
      const response = await fetch(`${CLINE_API_BASE}/auth/refresh`, {
          method: "POST",
          headers: buildClineAuthHeaders(),
          body: JSON.stringify({
              refreshToken: credentials.refresh,
              grantType: "refresh_token"
          })
      });

      if (!response.ok) throw new Error("Failed to refresh token. Please sign in again.");
      const data = await response.json() as any;
      if (!data.success || !data.data) throw new Error("Invalid refresh response");
      
      return {
          access: `workos:${data.data.accessToken}`,
          refresh: data.data.refreshToken || credentials.refresh,
          expires: new Date(data.data.expiresAt).getTime()
      };
    },

    getApiKey(credentials: any): string {
      return credentials.access;
    }
  };
}
