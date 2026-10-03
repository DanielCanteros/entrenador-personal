"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgresoView from "./ProgresoView.js";
import { clienteGetEvaluacion, clienteMe } from "../../lib/api.js";

export default function ProgresoDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    clienteMe()
      .then(({ cliente }) =>
        clienteGetEvaluacion()
          .then(({ evaluacion }) => ({ cliente, evaluacion }))
          .catch((err) => {
            if (active) setError(err.message);
            return { cliente, evaluacion: null };
          })
      )
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) router.replace("/cuenta/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (!data) {
    return (
      <div className="prog-loading" aria-busy="true">
        <div className="skeleton" style={{ width: "40%", height: 72, marginBottom: 20 }} />
        <div className="skeleton" style={{ width: "70%", height: 20, marginBottom: 48 }} />
        <div className="skeleton" style={{ width: "100%", height: 320 }} />
      </div>
    );
  }

  return (
    <>
      {error && <p className="contact-form__status is-error">{error}</p>}
      <ProgresoView cliente={data.cliente} evaluacion={data.evaluacion} />
    </>
  );
}
