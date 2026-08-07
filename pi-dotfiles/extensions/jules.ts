import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { OAuthCredentials } from "@mariozechner/pi-ai";

const STATUS_KEY = "jules";
const BASE_URL = "https://jules.googleapis.com/v1alpha";

interface JulesSource {
  name: string;
  id: string;
  githubRepo: {
    owner: string;
    repo: string;
  };
}

interface JulesSession {
  name: string;
  id: string;
  title: string;
  prompt: string;
  sourceContext: {
    source: string;
    githubRepoContext: {
      startingBranch: string;
    };
  };
  url?: string;
  outputs?: unknown[];
}

// OAuth login for Jules - prompts for API key
async function loginJules(callbacks: {
  onPrompt: (prompt: { message: string }) => Promise<string>;
}): Promise<OAuthCredentials> {
  const apiKey = await callbacks.onPrompt({ message: "Enter your Jules API key (get from jules.google.com/settings):" });
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }
  return {
    access: apiKey.trim(),
    refresh: "",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
  };
}

async function refreshJules(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  // Jules API keys don't expire, so just return the same
  return credentials;
}

function getJulesApiKey(credentials: OAuthCredentials): string {
  return credentials.access;
}

async function getApiKey(ctx: ExtensionContext): Promise<string> {
  // First try to get from model registry (OAuth login)
  const apiKey = await ctx.modelRegistry.getApiKeyForProvider("jules");
  if (apiKey) {
    return apiKey;
  }
  
  // Fall back to environment variable
  const envKey = process.env.JULES_API_KEY;
  if (!envKey) {
    throw new Error("JULES_API_KEY not set and not logged in. Run /login jules or set JULES_API_KEY env var");
  }
  return envKey;
}

async function julesFetch(apiKey: string, endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "X-Goog-Api-Key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jules API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export default function jules(pi: ExtensionAPI): void {
  // Register as a provider so Jules appears in /login
  pi.registerProvider("jules", {
    baseUrl: BASE_URL,
    apiKey: "JULES_API_KEY",
    api: "openai-completions",
    
    // Dummy model - Jules is an agent, not a chat model
    models: [
      {
        id: "jules-agent",
        name: "Jules (Agent)",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 16384,
      },
    ],
    
    oauth: {
      name: "Google Jules (API Key)",
      login: loginJules,
      refreshToken: refreshJules,
      getApiKey: getJulesApiKey,
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    // Check if logged in or env var set via model registry or env var
    const hasAuth = !!(await ctx.modelRegistry.getApiKeyForProvider("jules"));
    const hasEnvKey = !!process.env.JULES_API_KEY;
    
    if (hasAuth || hasEnvKey) {
      ctx.ui.setStatus(STATUS_KEY, "Jules: ready");
    } else {
      ctx.ui.setStatus(STATUS_KEY, "Jules: not logged in");
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    ctx.ui.setStatus(STATUS_KEY, undefined);
  });

  pi.registerCommand("jules", {
    description: "Google Jules coding agent - manage tasks on GitHub repos",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/);
      const sub = parts[0] || "";
      const rest = parts.slice(1).join(" ");

      try {
        const apiKey = await getApiKey(ctx);

        // Sources - list connected GitHub repos
        if (sub === "sources") {
          const data = (await julesFetch(apiKey, "/sources")) as { sources: JulesSource[] };
          if (!data.sources || data.sources.length === 0) {
            ctx.ui.notify("No GitHub repos connected. Install Jules GitHub app from jules.google.com", "info");
            return;
          }
          const lines = data.sources.map(
            (s) => `${s.id} → ${s.githubRepo.owner}/${s.githubRepo.repo}`
          );
          ctx.ui.notify(`Connected repos:\n${lines.join("\n")}`, "info");
          return;
        }

        // Sessions - list recent sessions
        if (sub === "sessions") {
          const data = (await julesFetch(apiKey, "/sessions?pageSize=10")) as { sessions: JulesSession[] };
          if (!data.sessions || data.sessions.length === 0) {
            ctx.ui.notify("No recent sessions", "info");
            return;
          }
          const lines = data.sessions.map(
            (s) => `${s.id.slice(0, 12)}... - ${s.title || s.prompt.slice(0, 40)}`
          );
          ctx.ui.notify(`Recent sessions:\n${lines.join("\n")}`, "info");
          return;
        }

        // Status - check a specific session
        if (sub === "status") {
          const sessionId = rest.trim();
          if (!sessionId) {
            ctx.ui.notify("Usage: /jules status <session-id>", "warning");
            return;
          }
          const data = (await julesFetch(apiKey, `/sessions/${sessionId}`)) as JulesSession;
          const outputs = data.outputs?.length 
            ? `\nOutputs: ${JSON.stringify(data.outputs, null, 2)}` 
            : "";
          ctx.ui.notify(
            `Session: ${data.title || data.id}\nPrompt: ${data.prompt}\nSource: ${data.sourceContext?.source}${outputs}`,
            "info"
          );
          return;
        }

        // Task - create a new task/session
        if (sub === "task") {
          // Parse: /jules task <source> "<prompt>" [options]
          // Example: /jules task github/owner/repo "Fix the bug" --auto-pr
          const match = rest.match(/^(\S+)\s+"([^"]+)"(.*)$/);
          if (!match) {
            ctx.ui.notify(
              'Usage: /jules task <source> "<prompt>" [--auto-pr]\n\nExample: /jules task github/owner/repo "Add a feature" --auto-pr',
              "warning"
            );
            return;
          }

          const sourceId = `sources/${match[1]}`;
          const prompt = match[2];
          const options = match[3];
          const autoPr = options.includes("--auto-pr");

          const payload: Record<string, unknown> = {
            prompt,
            sourceContext: {
              source: sourceId,
              githubRepoContext: {
                startingBranch: "main",
              },
            },
          };

          if (autoPr) {
            payload.automationMode = "AUTO_CREATE_PR";
          }

          const data = (await julesFetch(apiKey, "/sessions", {
            method: "POST",
            body: JSON.stringify(payload),
          })) as JulesSession;

          ctx.ui.notify(
            `Created session: ${data.id}\nView at: ${data.url || `https://jules.google.com/session/${data.id}`}`,
            "info"
          );
          return;
        }

        // Help / unknown command
        ctx.ui.notify(
          "Jules commands:\n" +
          "/jules sources - List connected GitHub repos\n" +
          "/jules task <repo> \"<prompt>\" - Create a task\n" +
          "/jules sessions - List recent sessions\n" +
          "/jules status <id> - Check session status\n\n" +
          "Options: --auto-pr to auto-create PR\n\n" +
          "Login: Run /login jules to authenticate",
          "info"
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Jules error: ${message}`, "error");
      }
    },
  });
}