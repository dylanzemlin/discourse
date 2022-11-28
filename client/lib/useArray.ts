import { useCallback, useState } from "react";

export default function useArray<T>(defaultValue?: T[]) {
  const [array, setArray] = useState<T[]>(defaultValue ?? []);

  const push = useCallback((item: T) => {
    setArray((prev: T[]) => [...prev, item]);
  }, []);

  const remove = useCallback((item: T) => {
    setArray((prev: T[]) => prev.filter((i) => i !== item));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  return {
    array,
    push,
    remove,
    clear,
  };
}