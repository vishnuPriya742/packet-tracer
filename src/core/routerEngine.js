const fs = require('fs');
const path = require('path');
const { ipInCidr, parseCidr } = require('./ipUtils');

class RouterEngine {
  constructor(configPath) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    this.routers = JSON.parse(raw); // array
  }

  // For now, use first router only (Router-1)
  findBestRoute(destIp) {
    const router = this.routers[0];
    if (!router) return null;

    let bestRoute = null;
    let bestPrefix = -1;

    for (const route of router.routes) {
      const { cidr } = route;
      const { maskBits } = parseCidr(cidr);
      if (ipInCidr(destIp, cidr)) {
        if (maskBits > bestPrefix) {
          bestPrefix = maskBits;
          bestRoute = route;
        }
      }
    }

    return { routerName: router.name, route: bestRoute };
  }

  route(packet, hopCounter) {
    let hop = hopCounter || 1;
    const trace = [];

    const { destination_ip, ttl } = packet;
    if (ttl <= 0) {
      trace.push({
        hop: hop++,
        location: 'Router',
        action: 'Time to Live exceeded before routing',
        details: { ttl }
      });
      return { error: 'TTL_EXCEEDED', trace, hop, newTtl: ttl };
    }

    const match = this.findBestRoute(destination_ip);

    if (!match || !match.route) {
      trace.push({
        hop: hop++,
        location: match ? match.routerName : 'Router',
        action: 'No route to host',
        details: { destination_ip }
      });
      return { error: 'NO_ROUTE', trace, hop, newTtl: ttl - 1 };
    }

    const newTtl = ttl - 1;
    if (newTtl <= 0) {
      trace.push({
        hop: hop++,
        location: match.routerName,
        action: 'Time to Live exceeded at router',
        details: { destination_ip, previous_ttl: ttl }
      });
      return { error: 'TTL_EXCEEDED', trace, hop, newTtl };
    }

    trace.push({
      hop: hop++,
      location: match.routerName,
      action: `Forwarded to ${match.route.next_hop} via ${match.route.interface}`,
      details: {
        destination_ip,
        ttl_remaining: newTtl,
        route_cidr: match.route.cidr
      }
    });

    return {
      error: null,
      trace,
      hop,
      newTtl,
      nextHop: match.route.next_hop,
      interface: match.route.interface
    };
  }
}

module.exports = RouterEngine;
