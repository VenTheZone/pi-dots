/**
 * MCP Tool Renderers Extension
 * 
 * Provides custom renderers for MCP tools (context7, jcodemunch) to keep
 * large outputs collapsed by default. Users can expand to see full content.
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

// MCP tool names to provide renderers for
const MCP_TOOLS = [
  // Exa tools
  "exa_web_search_exa",
  "exa_crawling_exa",
  "exa_get_code_context_exa",
  // Context7 tools
  "context7_resolve-library-id",
  "context7_query-docs",
  // jCodeMunch tools  
  "jcodemunch_index_repo",
  "jcodemunch_index_folder",
  "jcodemunch_index_file",
  "jcodemunch_list_repos",
  "jcodemunch_resolve_repo",
  "jcodemunch_get_file_tree",
  "jcodemunch_get_file_outline",
  "jcodemunch_get_symbol_source",
  "jcodemunch_get_file_content",
  "jcodemunch_search_symbols",
  "jcodemunch_invalidate_cache",
  "jcodemunch_search_text",
  "jcodemunch_get_repo_outline",
  "jcodemunch_find_importers",
  "jcodemunch_find_references",
  "jcodemunch_check_references",
  "jcodemunch_search_columns",
  "jcodemunch_get_context_bundle",
  "jcodemunch_get_session_stats",
  "jcodemunch_get_dependency_graph",
  "jcodemunch_get_symbol_diff",
  "jcodemunch_get_class_hierarchy",
  "jcodemunch_get_related_symbols",
  "jcodemunch_suggest_queries",
  "jcodemunch_get_blast_radius",
  "jcodemunch_wait_for_fresh",
  "jcodemunch_check_freshness",
  "jcodemunch_get_symbol_importance",
  "jcodemunch_find_dead_code",
  "jcodemunch_get_ranked_context",
  "jcodemunch_get_changed_symbols",
  "jcodemunch_embed_repo",
];

// Maximum lines to show when collapsed
const MAX_PREVIEW_LINES = 10;
// Maximum characters to show when collapsed
const MAX_PREVIEW_CHARS = 2000;

/**
 * Truncate text to a maximum number of lines and characters
 */
function truncateText(text: string, maxLines: number, maxChars: number): { preview: string; truncated: boolean } {
  const lines = text.split("\n");
  if (lines.length <= maxLines && text.length <= maxChars) {
    return { preview: text, truncated: false };
  }
  
  let preview = "";
  let lineCount = 0;
  for (const line of lines) {
    if (lineCount >= maxLines || preview.length + line.length + 1 > maxChars) {
      break;
    }
    preview += (lineCount > 0 ? "\n" : "") + line;
    lineCount++;
  }
  
  const remainingLines = lines.length - lineCount;
  const remainingChars = text.length - preview.length;
  const suffix = `\n... (${remainingLines} more lines, ${remainingChars} more chars) [Ctrl+E to expand]`;
  
  return { preview: preview + suffix, truncated: true };
}

/**
 * Get text content from tool result
 */
function getTextFromResult(result: { content?: Array<{ type: string; text?: string }> }): string {
  if (!result.content) return "";
  return result.content
    .filter(c => c.type === "text" && c.text)
    .map(c => c.text)
    .join("\n\n");
}

/**
 * Create a renderResult function that respects expanded state
 */
function createCollapsedRenderer() {
  return (
    result: { content?: Array<{ type: string; text?: string }> },
    options: { expanded: boolean; isPartial: boolean },
    theme: any,
    context: any
  ) => {
    const text = new Text("", 1, 1);
    
    // Get the text content
    const fullText = getTextFromResult(result);
    if (!fullText) {
      text.setText("");
      return text;
    }
    
    // If expanded, show full content
    if (options.expanded) {
      const lines = fullText.split("\n").map(line => theme.fg("toolOutput", line));
      text.setText(lines.join("\n"));
      return text;
    }
    
    // If partial (still executing), show a loading indicator
    if (options.isPartial) {
      text.setText(theme.fg("muted", "Executing..."));
      return text;
    }
    
    // Show truncated preview
    const { preview, truncated } = truncateText(fullText, MAX_PREVIEW_LINES, MAX_PREVIEW_CHARS);
    const styledPreview = preview.split("\n").map(line => theme.fg("toolOutput", line));
    
    if (truncated) {
      text.setText(styledPreview.join("\n"));
    } else {
      text.setText(styledPreview.join("\n"));
    }
    
    return text;
  };
}

/**
 * Create a renderCall function that shows tool name
 */
function createCallRenderer(toolName: string) {
  return (args: any, theme: any, context: any) => {
    const state = context.state;
    const text = context.lastComponent ?? new Text("", 1, 1);
    
    // Just show the tool name - the MCP server handles the actual call
    const displayArgs = Object.keys(args).length > 0 
      ? ` ${JSON.stringify(args, null, 0).slice(0, 100)}${JSON.stringify(args).length > 100 ? "..." : ""}`
      : "";
    
    text.setText(theme.fg("toolTitle", theme.bold(toolName)) + displayArgs);
    return text;
  };
}

export default function mcpRenderers(pi: ExtensionAPI): void {
  const renderResult = createCollapsedRenderer();
  
  for (const toolName of MCP_TOOLS) {
    // Register tool with custom renderer only
    // The actual execution is handled by the MCP server
    pi.registerTool({
      name: toolName,
      label: toolName,
      description: `MCP tool: ${toolName}`,
      // Minimal schema - MCP handles validation
      parameters: Type.Object({}, { additionalProperties: true }),
      // Dummy execute - MCP tools are executed by the MCP server, not here
      async execute() {
        // This should never be called since MCP handles execution
        // If it is called, return an error suggesting the user check MCP config
        return {
          content: [{ 
            type: "text" as const, 
            text: `[MCP renderer extension] This tool is handled by MCP. If you see this message, the MCP server may not be configured correctly.`
          }],
          details: undefined
        };
      },
      renderCall: createCallRenderer(toolName),
      renderResult,
    });
  }
}
