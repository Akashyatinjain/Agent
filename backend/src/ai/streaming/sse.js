/**
 * Server-Sent Events (SSE) Response Stream Engine
 */
export const setupSSEStream = (res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send periodic heartbeat comments to keep idle connections open through reverse proxies
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 15000);

  const sendEvent = (event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      res.flush?.();
    } catch (err) {
      // Socket closed
    }
  };

  const sendError = (error) => {
    sendEvent('error', {
      code: error.code || 'STREAM_ERROR',
      message: error.message || 'Stream transmission failed'
    });
  };

  const closeStream = () => {
    clearInterval(heartbeatInterval);
    sendEvent('end', { status: 'completed' });
    try {
      res.end();
    } catch (e) {}
  };

  res.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return { sendEvent, sendError, closeStream };
};

export default setupSSEStream;
