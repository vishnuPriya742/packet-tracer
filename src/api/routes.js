const express = require('express');

function createRoutes(packetTracer) {
  const router = express.Router();

  router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  router.post('/trace', (req, res) => {
    const {
      source_ip,
      destination,
      destination_port,
      protocol,
      ttl
    } = req.body;

    if (!source_ip || !destination || !destination_port || !protocol || ttl == null) {
      return res.status(400).json({
        error: 'Missing required fields: source_ip, destination, destination_port, protocol, ttl'
      });
    }

    try {
      const trace = packetTracer.trace({
        source_ip,
        destination,
        destination_port: Number(destination_port),
        protocol: protocol.toUpperCase(),
        ttl: Number(ttl)
      });

      res.json({ trace });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = createRoutes;
