// Use the editor's normal input path instead of mutating contenteditable DOM with fill().
export async function setEditorCode(page, source) {
  const editor = page.getByRole('textbox', { name: 'Código Portugol' });
  await editor.click();
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(source);
}
