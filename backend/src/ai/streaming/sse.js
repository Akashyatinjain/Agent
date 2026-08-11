/**
 * Server-Sent Events (SSE) Response Stream Handler
 */
export const setupSSEStream = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const closeStream = () => {
    sendEvent('end', { status: 'completed' });
    res.end();
  };

  return { sendEvent, closeStream };
};

export default setupSSEStream;
