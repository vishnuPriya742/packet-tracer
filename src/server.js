const express = require('express');
const path = require('path');

const DNSResolver = require('./core/dnsResolver');
const RouterEngine = require('./core/routerEngine');
const Firewall = require('./core/firewall');
const PacketTracer = require('./core/packetTracer');
const createRoutes = require('./api/routes');

const app = express();
app.use(express.json());

// Build absolute paths for configs
const dnsPath = path.join(__dirname, 'config', 'dns.json');
const routesPath = path.join(__dirname, 'config', 'routes.json');
const firewallPath = path.join(__dirname, 'config', 'firewall.json');

// Initialize core components
const dnsResolver = new DNSResolver(dnsPath);
const routerEngine = new RouterEngine(routesPath);
const firewall = new Firewall(firewallPath);
const packetTracer = new PacketTracer(dnsResolver, routerEngine, firewall);

// Register API routes
app.use('/', createRoutes(packetTracer));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Packet tracer API running on port ${PORT}`);
});
