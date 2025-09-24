import React from "react";
import { useData } from '../context/DataContext';
export default function Logs() {
  const { logs } = useData();
return (
  <div>
    {logs.map((log, i) => (
      <pre key={i}>{JSON.stringify(log, null, 2)}</pre>
    ))}
  </div>
);
}