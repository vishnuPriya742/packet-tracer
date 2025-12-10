const fs = require('fs');
const path = require('path');
const { ipInCidr, portMatches } = require('./ipUtils');

class Firewall {
  constructor(configPath) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    this.rules = JSON.parse(raw);
  }

  // Default policy: deny if no rule matches
  inspect(packet, hopCounter) {
    let hop = hopCounter || 1;
    const trace = [];

    const { source_ip, destination_port, protocol } = packet;

    trace.push({
      hop: hop++,
      location: 'Firewall',
      action: 'Starting firewall inspection',
      details: {
        source_ip,
        destination_port,
        protocol
      }
    });

    for (const rule of this.rules) {
      const protoMatch =
        rule.protocol === 'ANY' || rule.protocol === protocol;

      const srcMatch = ipInCidr(source_ip, rule.source);
      const portMatch = portMatches(destination_port, rule.destination_port);

      if (protoMatch && srcMatch && portMatch) {
        const allowed = rule.action.toLowerCase() === 'allow';

        trace.push({
          hop: hop++,
          location: 'Firewall',
          action: allowed
            ? `Packet allowed by rule #${rule.id}`
            : `Packet blocked by rule #${rule.id}`,
          details: { rule }
        });

        return {
          allowed,
          trace,
          hop,
          matchedRule: rule
        };
      }
    }

    // No matching rule → deny by default
    trace.push({
      hop: hop++,
      location: 'Firewall',
      action: 'No matching rule found, default deny',
      details: {}
    });

    return {
      allowed: false,
      trace,
      hop,
      matchedRule: null
    };
  }
}

module.exports = Firewall;
