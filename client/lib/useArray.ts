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

  const length = useCallback(() => {
    return array.length;
  }, [array]);

  const removeAt = useCallback((index: number) => {
    setArray((prev: T[]) => {
      const arr = [...prev];
      arr.splice(index, 1);
      return arr;
    });
  }, []);

  return {
    array,
    push,
    remove,
    clear,
    length,
    removeAt
  };
}