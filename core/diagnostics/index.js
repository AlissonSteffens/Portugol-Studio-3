// Identificadores correspondem às classes de mensagens do core Java.
export function diagnostic(id, node, message, severity = 'error') {
  return { code: id, from: node?.from ?? 0, to: node?.to ?? (node?.from ?? 0) + 1, severity, message };
}

export function diagnosticError(item, diagnostics = [item]) {
  return Object.assign(new Error(item.message), item, { diagnostics });
}

export function runtimeError(id, message) {
  return Object.assign(new Error(message), { code: `ErroExecucao.${id}`, severity: 'error' });
}

