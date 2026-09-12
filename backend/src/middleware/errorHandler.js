export function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  console.error("[error]", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: "El recurso ya existe (valor duplicado)" });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Error interno del servidor" : err.message,
  });
}
