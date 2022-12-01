import { useCallback, useEffect, useState } from "react";

type UseApiProps = {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: any;
  runImmediate?: boolean;
}

export default function useApi<T>(props: UseApiProps) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const { url, method, body, headers } = props;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setData(null);
    setError(null);
    
    const result = await fetch(url, {
      method,
      body,
      headers
    });

    if (result.ok) {
      const data = await result.json();
      setData(data);
      setLoading(false);
      return;
    }

    setError(new Error(result.statusText));
    setLoading(false);
  }, [url, method, body, headers]);

  useEffect(() => {
    if (props.runImmediate) {
      fetchData();
    }
  }, [fetchData, props.runImmediate]);

  return {
    data,
    error,
    loading,
    refetch: fetchData
  }
}