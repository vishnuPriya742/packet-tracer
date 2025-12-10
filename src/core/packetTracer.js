class PacketTracer {
  constructor(dnsResolver, routerEngine, firewall) {
    this.dnsResolver = dnsResolver;
    this.routerEngine = routerEngine;
    this.firewall = firewall;
  }

  trace(packetInput) {
    let hop = 1;
    const fullTrace = [];

    // Normalize packet
    const packet = {
      source_ip: packetInput.source_ip,
      destination: packetInput.destination,
      destination_ip: null,
      destination_port: packetInput.destination_port,
      protocol: packetInput.protocol,
      ttl: packetInput.ttl
    };

    // 1. DNS
    const dnsResult = this.dnsResolver.resolve(packet.destination, hop);
    fullTrace.push(...dnsResult.trace);
    hop = dnsResult.hop;

    if (dnsResult.error) {
      return fullTrace; // NXDOMAIN etc.
    }

    packet.destination_ip = dnsResult.ip;

    // 2. Routing
    const routeResult = this.routerEngine.route(
      {
        destination_ip: packet.destination_ip,
        ttl: packet.ttl
      },
      hop
    );
    fullTrace.push(...routeResult.trace);
    hop = routeResult.hop;
    packet.ttl = routeResult.newTtl;

    if (routeResult.error) {
      // TTL_EXCEEDED or NO_ROUTE
      return fullTrace;
    }

    // 3. Firewall
    const fwResult = this.firewall.inspect(
      {
        source_ip: packet.source_ip,
        destination_ip: packet.destination_ip,
        destination_port: packet.destination_port,
        protocol: packet.protocol
      },
      hop
    );
    fullTrace.push(...fwResult.trace);
    hop = fwResult.hop;

    if (!fwResult.allowed) {
      return fullTrace;
    }

    // 4. Final delivery
    fullTrace.push({
      hop: hop++,
      location: 'Destination Host',
      action: 'Packet delivered successfully',
      details: {
        destination_ip: packet.destination_ip,
        destination_port: packet.destination_port,
        protocol: packet.protocol,
        ttl_remaining: packet.ttl
      }
    });

    return fullTrace;
  }
}

module.exports = PacketTracer;
