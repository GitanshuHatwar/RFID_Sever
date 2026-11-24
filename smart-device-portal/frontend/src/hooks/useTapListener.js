import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function useTapListener(enabled) {
  const afterId = useRef(0);
  const queue = useRef([]);
  const [current, setCurrent] = useState(null);
  const showNext = useCallback(() => {
    setCurrent(queue.current.shift() || null);
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timer;
    api.get("/api/taps/latest-id").then(({data}) => {
      afterId.current = data.latest_id;
      const poll = async () => {
        try {
          const response = await api.get("/api/taps/latest", {params:{after_id:afterId.current}});
          if (!active) return;
          if (response.data.length) {
            queue.current.push(...response.data);
            afterId.current = Math.max(afterId.current, ...response.data.map(t => t.id));
            setCurrent((existing) => existing || queue.current.shift() || null);
          }
        } catch (_) {}
      };
      poll();
      timer = setInterval(poll, 2000);
    });
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [enabled]);
  const dismiss = () => showNext();
  return { current, dismiss };
}
