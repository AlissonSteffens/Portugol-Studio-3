import { useEffect, useState } from 'react';

export function readStored(key, fallback, validate = () => true) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value !== null && validate(value) ? value : fallback;
  } catch (error) { console.warn('Não foi possível restaurar a preferência ' + key + '.', error); return fallback; }
}

export default function useStoredState(name, fallback, validate) {
  const key = 'portugol-studio-' + name;
  const [value, setValue] = useState(() => readStored(key, fallback, validate));
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.warn('Não foi possível salvar a preferência ' + name + '.', error); }
  }, [key, value]);
  return [value, setValue];
}
