import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpRight, Braces, Check, ChevronDown,
  CircleHelp, Clock3, Copy, ExternalLink, Globe2, History, Layers3,
  LoaderCircle, Play, RotateCcw, Search, ShieldCheck, Sparkles, Terminal,
  Wallet, Zap,
} from "lucide-react";

const HORIZON = "https://horizon-testnet.stellar.org";
type Endpoint = { id: string; group: string; label: string; method: string; path: string; description: string; icon: typeof Activity; sample: string };

const endpoints: Endpoint[] = [
  { id: "health", group: "Network", label: "Network health", method: "GET", path: "/", description: "Check whether the Horizon Testnet API is reachable.", icon: Activity, sample: "/" },
  { id: "ledgers", group: "Network", label: "Latest ledgers", method: "GET", path: "/ledgers?order=desc&limit=5", description: "Read the newest ledger headers and sequence numbers.", icon: Layers3, sample: "/ledgers?order=desc&limit=5" },
  { id: "fee", group: "Network", label: "Fee statistics", method: "GET", path: "/fee_stats", description: "Inspect recent transaction fee statistics.", icon: Zap, sample: "/fee_stats" },
  { id: "assets", group: "Assets", label: "List assets", method: "GET", path: "/assets?limit=10&order=desc", description: "Explore issued assets known to the test network.", icon: Sparkles, sample: "/assets?limit=10&order=desc" },
  { id: "payments", group: "Transactions", label: "Recent payments", method: "GET", path: "/payments?order=desc&limit=10", description: "Fetch recent payment operations from the ledger.", icon: ArrowUpRight, sample: "/payments?order=desc&limit=10" },
  { id: "transactions", group: "Transactions", label: "Recent transactions", method: "GET", path: "/transactions?order=desc&limit=5", description: "Inspect recent transactions and their result codes.", icon: History, sample: "/transactions?order=desc&limit=5" },
  { id: "operations", group: "Transactions", label: "Recent operations", method: "GET", path: "/operations?order=desc&limit=10", description: "Explore operations included in recent ledger activity.", icon: Terminal, sample: "/operations?order=desc&limit=10" },
  { id: "account", group: "Accounts", label: "Account details", method: "GET", path: "/accounts/{account_id}", description: "Look up balances, sequence number and account flags.", icon: Wallet, sample: "/accounts/" },
];

type ApiResult = { status: number; duration: number; data: unknown; url: string; ok: boolean };
const groups = ["Network", "Assets", "Transactions", "Accounts"];

function App() {
  const [selected, setSelected] = useState("health");
  const [path, setPath] = useState("/");
  const [accountId, setAccountId] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"response" | "headers">("response");
  const [friendbotAddress, setFriendbotAddress] = useState("");
  const [funding, setFunding] = useState(false);
  const [fundMessage, setFundMessage] = useState("");

  const current = endpoints.find((e) => e.id === selected) ?? endpoints[0];
  const visibleEndpoints = useMemo(() => endpoints.filter((e) => (e.label + e.description + e.path).toLowerCase().includes(filter.toLowerCase())), [filter]);

  useEffect(() => { setPath(current.sample); setResult(null); setError(""); }, [selected]);

  async function runRequest(event?: FormEvent) {
    event?.preventDefault();
    let requestPath = path.trim() || "/";
    if (selected === "account") {
      const id = accountId.trim();
      if (!id) { setError("Enter a Stellar public account address (starts with G)."); return; }
      requestPath = "/accounts/" + encodeURIComponent(id);
      setPath(requestPath);
    }
    if (!requestPath.startsWith("/")) requestPath = "/" + requestPath;
    if (requestPath.startsWith("//") || requestPath.includes("://")) { setError("Enter a Horizon path only, not a full URL."); return; }
    setLoading(true); setError(""); setResult(null);
    const url = HORIZON + requestPath;
    const start = performance.now();
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const duration = Math.round(performance.now() - start);
      const text = await response.text();
      let data: unknown;
      try { data = text ? JSON.parse(text) : {}; } catch { data = text; }
      setResult({ status: response.status, duration, data, url, ok: response.ok });
      setTab("response");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  async function copyResponse() {
    if (!result) return;
    try { await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1400); }
    catch { setError("Clipboard access was blocked by your browser."); }
  }

  async function fundAccount(event: FormEvent) {
    event.preventDefault();
    const address = friendbotAddress.trim();
    if (!address.startsWith("G") || address.length !== 56) { setFundMessage("Enter a valid Stellar public key (56 characters, starting with G)."); return; }
    setFunding(true); setFundMessage("");
    try {
      const response = await fetch("https://friendbot.stellar.org/?addr=" + encodeURIComponent(address));
      const body = await response.json();
      if (!response.ok) throw new Error(body?.detail || body?.title || "Friendbot could not fund this account.");
      setFundMessage("Success — the testnet account has been funded. You can now query it above.");
    } catch (e) { setFundMessage(e instanceof Error ? e.message : "Funding request failed."); }
    finally { setFunding(false); }
  }

  const pretty = result ? JSON.stringify(result.data, null, 2) : "";
  const count = result && typeof result.data === "object" && result.data !== null && "_embedded" in result.data
    ? (result.data as { _embedded?: { records?: unknown[] } })._embedded?.records?.length ?? 0 : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setSelected("health"); }}>
          <span className="brand-mark"><Globe2 size={21} /></span><span>stellar<span className="brand-light">lab</span><small>API PLAYGROUND</small></span>
        </a>
        <div className="topbar-right"><span className="network-pill"><span className="live-dot" /> Stellar Testnet</span><a className="top-link" href="https://developers.stellar.org/docs/data/horizon" target="_blank" rel="noreferrer">Docs <ExternalLink size={13} /></a><a className="github-link" href="https://github.com/kennyedyoletu/Stellar-API-Playground" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a></div>
      </header>

      <div className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> DEVELOPER TOOLKIT <span className="eyebrow-line" /></div><h1>Explore Stellar.<br /><span>One request at a time.</span></h1><p>Make real API calls to the Stellar Horizon Testnet. Explore accounts, assets, ledgers and transactions — no setup required.</p><div className="hero-tags"><span><ShieldCheck size={14} /> Testnet safe</span><span><Braces size={14} /> JSON responses</span><span><Zap size={14} /> Live requests</span></div></div>
        <div className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="planet"><Globe2 size={52} strokeWidth={1.2} /></div><div className="float-card float-card-top"><span className="tiny-dot" /> HORIZON API <b>ONLINE</b></div><div className="float-card float-card-bottom"><span className="pulse-bars"><i /><i /><i /><i /></span><div><b>Test network</b><small>Sandbox environment</small></div></div></div>
      </div>

      <main className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading"><span>API EXPLORER</span><span className="count-badge">{endpoints.length}</span></div>
          <div className="sidebar-search"><Search size={15} /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find an endpoint..." /></div>
          {groups.map((group) => {
            const items = visibleEndpoints.filter((e) => e.group === group);
            if (!items.length) return null;
            return <div className="endpoint-group" key={group}><div className="group-title">{group}</div>{items.map((ep) => { const Icon = ep.icon; return <button key={ep.id} className={"endpoint-item " + (selected === ep.id ? "active" : "")} onClick={() => setSelected(ep.id)}><Icon size={16} /><span>{ep.label}</span><span className="method-mini">GET</span></button>; })}</div>;
          })}
          <div className="sidebar-bottom"><div className="secure-icon"><ShieldCheck size={17} /></div><div><b>Read-only requests</b><p>This playground queries testnet data. It never signs or submits transactions.</p></div></div>
        </aside>

        <section className="main-panel">
          <div className="panel-title-row"><div><div className="breadcrumb">PLAYGROUND <span>/</span> {current.group.toUpperCase()}</div><h2>{current.label}</h2><p>{current.description}</p></div><span className="read-only-label"><span className="live-dot" /> LIVE API</span></div>
          <form className="request-card" onSubmit={runRequest}>
            <div className="request-card-top"><div className="method-select">GET <ChevronDown size={13} /></div><span className="request-label">REQUEST URL</span><button className="reset-button" type="button" onClick={() => { setPath(current.sample); setAccountId(""); setError(""); setResult(null); }}><RotateCcw size={13} /> Reset</button></div>
            {selected === "account" && <div className="account-input-wrap"><label htmlFor="account">STELLAR PUBLIC KEY</label><input id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="G... public account address" spellCheck={false} /></div>}
            <div className="url-bar"><span className="url-host">{HORIZON.replace("https://", "")}</span><input aria-label="Horizon API path" value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} /><button className="run-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={15} className="spin" /> : <Play size={14} fill="currentColor" />} {loading ? "Running" : "Send request"}</button></div>
            <div className="request-foot"><span><span className="method-dot" /> GET request</span><span><ShieldCheck size={13} /> Public endpoint · No API key</span></div>
          </form>

          <div className="response-header"><div><h3>Response</h3><p>Inspect the live data returned by Horizon.</p></div>{result && <div className="response-metrics"><span className={result.ok ? "status status-ok" : "status status-error"}>{result.status} {result.ok ? "OK" : "ERROR"}</span><span><Clock3 size={13} /> {result.duration} ms</span>{count !== null && <span><Layers3 size={13} /> {count} records</span>}</div>}</div>
          <div className="response-card">
            <div className="response-tabs"><button className={tab === "response" ? "tab active-tab" : "tab"} onClick={() => setTab("response")} type="button"><Braces size={14} /> Body <span className="tab-count">{result ? "JSON" : "—"}</span></button><button className={tab === "headers" ? "tab active-tab" : "tab"} onClick={() => setTab("headers")} type="button"><Layers3 size={14} /> Request info</button>{result && <button className="copy-button" onClick={copyResponse} type="button">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy JSON"}</button>}</div>
            <div className="code-area">
              {loading ? <div className="empty-state"><LoaderCircle size={27} className="spin" /><b>Requesting Horizon...</b><span>Fetching live testnet data</span></div>
                : error ? <div className="error-state"><CircleHelp size={23} /><b>Request could not complete</b><p>{error}</p><button onClick={() => runRequest()} type="button">Try again</button></div>
                : result && tab === "response" ? <pre className="json-code">{pretty.split("\n").map((line, i) => <span className="code-line" key={i}><span className="line-number">{i + 1}</span><span>{line.split(/("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b/g).map((part, j) => { let cls = ""; if (/^".*"\s*:$/.test(part)) cls = "json-key"; else if (/^"/.test(part)) cls = "json-string"; else if (/^(true|false|null)$/.test(part)) cls = "json-bool"; else if (/^-?\d/.test(part)) cls = "json-number"; return <span className={cls} key={j}>{part}</span>; })}</span></span>)}</pre>
                : result && tab === "headers" ? <div className="info-list"><div><span>Request URL</span><code>{result.url}</code></div><div><span>Method</span><code>GET</code></div><div><span>HTTP status</span><code>{result.status}</code></div><div><span>Duration</span><code>{result.duration} ms</code></div><div><span>Response type</span><code>application/json</code></div></div>
                : <div className="empty-state"><div className="empty-icon"><Terminal size={24} /></div><b>Ready when you are</b><span>Choose an endpoint, then send a request to see live JSON data.</span><button type="button" onClick={() => runRequest()}><Play size={13} fill="currentColor" /> Run sample request</button></div>}
            </div>
            <div className="response-footer"><span><span className="tiny-dot" /> {result ? "Response received" : "Waiting for request"}</span><span>Powered by Horizon API <ArrowUpRight size={12} /></span></div>
          </div>

          <section className="funding-card"><div className="funding-icon"><Wallet size={19} /></div><div className="funding-copy"><h3>Need testnet XLM?</h3><p>Fund a testnet account with Friendbot. Enter a public key — never enter your secret key here.</p><form onSubmit={fundAccount} className="funding-form"><input value={friendbotAddress} onChange={(e) => setFriendbotAddress(e.target.value)} placeholder="G... your public account address" aria-label="Public key to fund" spellCheck={false} /><button type="submit" disabled={funding}>{funding ? <LoaderCircle size={14} className="spin" /> : <ArrowDownToLine size={14} />}{funding ? "Funding..." : "Fund test account"}</button></form>{fundMessage && <p className={fundMessage.startsWith("Success") ? "fund-message success" : "fund-message"}>{fundMessage}</p>}</div></section>
          <footer className="page-footer"><span>Built for developers exploring <b>Stellar</b></span><span><a href="https://laboratory.stellar.org/" target="_blank" rel="noreferrer">Stellar Laboratory <ExternalLink size={12} /></a><span className="footer-sep">·</span><a href="https://developers.stellar.org/docs/data/horizon" target="_blank" rel="noreferrer">Horizon docs <ExternalLink size={12} /></a></span></footer>
        </section>
      </main>
      <div className="disclaimer"><ShieldCheck size={14} /><span><b>Testnet only.</b> Test assets and XLM have no real-world value. This tool makes read-only Horizon calls; Friendbot funding is limited to testnet accounts.</span></div>
    </div>
  );
}

export default App;
