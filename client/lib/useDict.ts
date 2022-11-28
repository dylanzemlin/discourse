import { useState } from "react";

export default function useDict<A extends keyof any, B>() {
  const [dict, setDict] = useState<Record<A, B>>({} as Record<A, B>);

  const set = (key: A, value: B) => {
    setDict(prev => ({ ...prev, [key]: value }));
  }

  const get = (key: A): B => {
    return dict[key];
  }

  const values = (): B[] => {
    return Object.values(dict);
  }

  const keys = (): A[] => {
    return Object.keys(dict) as A[];
  }

  return { set, get, values, keys }
}