// Convert IPv4 string to 32-bit number
function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => p < 0 || p > 255 || Number.isNaN(p))) {
    throw new Error(`Invalid IP: ${ip}`);
  }
  return (
    (parts[0] << 24) +
    (parts[1] << 16) +
    (parts[2] << 8) +
    parts[3]
  ) >>> 0; // unsigned
}

// Parse CIDR "192.168.1.0/24" → { network, maskBits }
function parseCidr(cidr) {
  const [ip, bitsStr] = cidr.split('/');
  const maskBits = parseInt(bitsStr, 10);
  const ipInt = ipToInt(ip);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  const network = ipInt & mask;
  return { network, maskBits, mask };
}

// Check if ip is in cidr
function ipInCidr(ip, cidr) {
  const { network, mask } = parseCidr(cidr);
  const ipInt = ipToInt(ip);
  return (ipInt & mask) === network;
}

// Parse port field: "22", "80-443", or number
function parsePortSpec(spec) {
  if (typeof spec === 'number') return { from: spec, to: spec };
  if (typeof spec === 'string') {
    if (spec.includes('-')) {
      const [start, end] = spec.split('-').map(Number);
      return { from: start, to: end };
    }
    const num = parseInt(spec, 10);
    return { from: num, to: num };
  }
  throw new Error(`Invalid port spec: ${spec}`);
}

// Check if port in range
function portMatches(port, spec) {
  const { from, to } = parsePortSpec(spec);
  return port >= from && port <= to;
}

module.exports = {
  ipToInt,
  parseCidr,
  ipInCidr,
  portMatches
};
