#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need_cmd node
need_cmd npm
need_cmd pi
need_cmd python
need_cmd uvx

cd "$ROOT_DIR"

echo "==> Package checks"
for dir in pi-mcp-access pi-agents; do
  echo "--> $dir"
  (cd "$dir" && npm run check)
done

echo "==> Project-local pi smoke test"
python <<'PY'
import json, subprocess, os, time, sys, select
cwd=os.path.abspath('pi-dotfiles')
proc=subprocess.Popen(['pi','--mode','rpc','--no-session'], cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

def send(obj):
    proc.stdin.write(json.dumps(obj)+'\n')
    proc.stdin.flush()

def wait_for_response(req_id, timeout=40):
    start=time.time()
    events=[]
    while time.time()-start<timeout:
        ready, _, _ = select.select([proc.stdout, proc.stderr], [], [], 1)
        for stream in ready:
            line = stream.readline()
            if not line:
                continue
            if stream is proc.stderr:
                raise RuntimeError(line.strip())
            obj=json.loads(line)
            events.append(obj)
            if obj.get('type')=='response' and obj.get('id')==req_id:
                return obj, events
    raise RuntimeError(f'timeout waiting for {req_id}')

try:
    send({'type':'get_commands','id':'cmds'})
    resp, _ = wait_for_response('cmds')
    commands={c['name'] for c in resp['data']['commands']}
    required={'plan','implement','scout-and-plan','implement-and-review'}
    missing=sorted(required-commands)
    if missing:
        raise RuntimeError('missing prompt commands: ' + ', '.join(missing))

    send({'type':'prompt','message':'/mcp tools','id':'mcp'})
    resp, events = wait_for_response('mcp')
    if not resp.get('success'):
        raise RuntimeError('mcp tools command failed')
    notify=''
    for obj in events:
        if obj.get('type')=='extension_ui_request' and obj.get('method')=='notify':
            notify=obj.get('message') or ''
    if 'context7_query-docs' not in notify:
        raise RuntimeError('context7 MCP tools not detected')
    if 'exa_web_search_exa' not in notify:
        raise RuntimeError('exa MCP tools not detected')
    if 'jcodemunch_search_text' not in notify:
        raise RuntimeError('jcodemunch MCP tools not detected')

    print('Commands OK:', ', '.join(sorted(required)))
    print('MCP OK: context7 + exa + jcodemunch')
finally:
    proc.kill()
    try:
        proc.wait(timeout=5)
    except Exception:
        pass
PY

echo "==> Bootstrap check passed"
