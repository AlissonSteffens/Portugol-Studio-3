export default function Terminal({ terminalRef, clear }) {
  return <section className="panel flex min-h-52 flex-1 flex-col overflow-hidden">
    <div className="panel-heading"><span>›_ &nbsp; Terminal</span><button onClick={clear}>Limpar</button></div>
    <div ref={terminalRef} className="terminal flex-1" aria-label="Terminal de execução" aria-live="polite" />
  </section>;
}
