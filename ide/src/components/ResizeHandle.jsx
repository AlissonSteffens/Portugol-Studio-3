export default function ResizeHandle({ label, className, value, onChange, min, max, getValue, orientation = 'vertical' }) {
  return <div role="separator" tabIndex={0} aria-label={label} aria-orientation={orientation} aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(value * 100) / 100} className={'resize-handle ' + className}
    onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }}
    onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) onChange(Math.max(min, Math.min(max, getValue(event)))); }}
    onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onKeyDown={event => {
      const decrease = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      const increase = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      if (!decrease && !increase && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      onChange(event.key === 'Home' ? min : event.key === 'End' ? max : Math.max(min, Math.min(max, value + (increase ? 1 : -1) * (max > 1 ? 10 : .05))));
    }}/>;
}
