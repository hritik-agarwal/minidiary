import { useLayoutEffect, useRef } from "react";

export default function ResizableTextarea({ value, ...rest }) {
  const ref = useRef(null);

  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  useLayoutEffect(fit, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onInput={fit}
      {...rest}
    />
  );
}
