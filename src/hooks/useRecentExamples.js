import useStoredState from './useStoredState.js';

export default function useRecentExamples() {
  const [stored, setStored] = useStoredState('recent-examples', [], value => Array.isArray(value) && value.every(id => typeof id === 'string'));
  const ids = [...new Set(stored)].slice(0, 8);
  const remember = id => {
    if (id) setStored(current => [id, ...new Set(current.filter(previous => previous !== id))].slice(0, 8));
  };
  return { ids, remember, clear: () => setStored([]) };
}
