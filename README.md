# Packet Tracer API – DNS, Routing, Firewall Simulator

This project simulates the journey of a network packet through a virtual network.  
It demonstrates core networking concepts such as:

- DNS Resolution (A and CNAME records)
- IP Routing using Longest Prefix Match
- TTL (Time-To-Live) handling and expiry
- Firewall rule processing using ordered allow/deny rules
- Network error handling: NXDOMAIN, No Route to Host, TTL Exceeded, Firewall Block

The API accepts a packet and returns a **hop-by-hop trace** of its path through DNS → Router → Firewall → Destination.

---

## 🚀 Features

- `POST /trace` endpoint that simulates complete packet flow.
- Built-in DNS resolver supporting A and CNAME records from JSON config.
- Routing engine that applies the Longest Prefix Match algorithm.
- TTL decrementing at every router hop.
- Ordered firewall evaluation with allow/deny rules.
- Rich error handling (NXDOMAIN, No Route to Host, TTL exceeded).
- Configurable network scenarios.

---

## 📦 Project Structure

