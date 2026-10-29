export function notFound(req, res) { res.status(404).json({ error:{ code:'NOT_FOUND', message:'This endpoint does not exist.', requestId:req.requestId } }); }
export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;
  const status = error.status || (error.code === 'VALIDATION_ERROR' ? 400 : error.code === 'AI_PROVIDER_ERROR' ? 502 : error.code === 'GENERATION_VALIDATION_ERROR' ? 422 : 500);
  if (status >= 500) console.error({ requestId:req.requestId, code:error.code || 'INTERNAL_SERVER_ERROR', message:error.message });
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : error.message;
  res.status(status).json({ error:{ code, message, requestId:req.requestId } });
}
