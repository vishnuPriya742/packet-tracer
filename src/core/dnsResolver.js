const fs = require('fs');
const path = require('path');

class DNSResolver {
  constructor(configPath) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    this.aRecords = config.A || {};
    this.cnameRecords = config.CNAME || {};
  }

  isIp(str) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(str);
  }

  resolve(destination, hopCounter) {
    const trace = [];
    let hop = hopCounter || 1;

    if (this.isIp(destination)) {
      trace.push({
        hop: hop++,
        location: 'DNS Resolver',
        action: `Destination is already an IP address (${destination}), no DNS lookup needed`,
        details: { ip: destination }
      });
      return { ip: destination, trace, hop };
    }

    let hostname = destination;
    const visited = new Set();

    trace.push({
      hop: hop++,
      location: 'DNS Resolver',
      action: `Starting DNS resolution for ${hostname}`,
      details: {}
    });

    // Resolve CNAME chain
    while (this.cnameRecords[hostname]) {
      if (visited.has(hostname)) {
        trace.push({
          hop: hop++,
          location: 'DNS Resolver',
          action: `CNAME loop detected for ${hostname}`,
          details: {}
        });
        return { error: 'NXDOMAIN', trace, hop };
      }
      visited.add(hostname);

      const target = this.cnameRecords[hostname];
      trace.push({
        hop: hop++,
        location: 'DNS Resolver',
        action: `CNAME ${hostname} → ${target}`,
        details: {}
      });
      hostname = target;
    }

    const ip = this.aRecords[hostname];
    if (!ip) {
      trace.push({
        hop: hop++,
        location: 'DNS Resolver',
        action: `NXDOMAIN: ${hostname} not found`,
        details: {}
      });
      return { error: 'NXDOMAIN', trace, hop };
    }

    trace.push({
      hop: hop++,
      location: 'DNS Resolver',
      action: `Resolved ${hostname} to ${ip}`,
      details: { ip }
    });

    return { ip, trace, hop };
  }
}

module.exports = DNSResolver;
