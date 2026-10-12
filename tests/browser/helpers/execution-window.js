export async function restoreExecutionWindow(popup) {
  const closed = popup.waitForEvent('close');
  await Promise.all([
    closed,
    popup.getByRole('button', { name: 'Trazer para o editor', exact: true })
      .click({ noWaitAfter: true }).catch(error => {
        // The click handler closes its own page. Chromium can report that
        // closure while the input command is still completing on Linux.
        if (!popup.isClosed() || !error.message.includes('Target page, context or browser has been closed')) throw error;
      }),
  ]);
}
