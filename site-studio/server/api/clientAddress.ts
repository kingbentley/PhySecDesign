// The network address a request is counted under, for the per-address wrong-code count (CA-05).
//
// On Cloudflare the client's address is the `CF-Connecting-IP` header, which Cloudflare sets on
// every request and a client cannot override. Self-hosted, the same header is read if present:
// the bundled web server must set it or strip it (stories 2.21 and 2.22, which also add the
// configured-proxy rule for `X-Forwarded-For`). Without the header, as on the local runtime,
// every request shares one bucket, which only makes the count stricter.
//
// An IPv6 client usually controls a whole /64, so IPv6 addresses are counted by their /64 prefix;
// IPv4 addresses (including IPv4-mapped IPv6) are counted whole.

export const CLIENT_ADDRESS_HEADER = "cf-connecting-ip";
/** The bucket shared by requests whose address is absent or unreadable. */
export const UNKNOWN_ADDRESS = "unknown";

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HEXTET = /^[0-9a-f]{1,4}$/;

/** The eight 16-bit groups of an IPv6 address, or null if it is not one. */
export function ipv6Groups(text: string): number[] | null {
  let value = text.toLowerCase();
  // A zone index (fe80::1%eth0) names an interface, not part of the address.
  const zone = value.indexOf("%");
  if (zone !== -1) value = value.slice(0, zone);
  // An IPv4 tail (::ffff:192.0.2.1) is rewritten as its two groups.
  const lastColon = value.lastIndexOf(":");
  if (lastColon === -1) return null;
  const last = value.slice(lastColon + 1);
  if (last.includes(".")) {
    if (!IPV4.test(last)) return null;
    const [a, b, c, d] = last.split(".").map(Number) as [number, number, number, number];
    value = value.slice(0, lastColon + 1) + (((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16));
  }
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string): number[] | null => {
    if (part === "") return [];
    const groups = part.split(":");
    if (!groups.every((group) => HEXTET.test(group))) return null;
    return groups.map((group) => parseInt(group, 16));
  };
  const head = parse(halves[0] ?? "");
  const tail = halves.length === 2 ? parse(halves[1] ?? "") : [];
  if (!head || !tail) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const missing = 8 - head.length - tail.length;
  if (missing < 1) return null;
  return [...head, ...new Array<number>(missing).fill(0), ...tail];
}

/**
 * The key a request's address is counted under: an IPv4 address as it is, an IPv6 address as its
 * /64 prefix (`2001:db8:1:2::/64`), an IPv4-mapped IPv6 address as its IPv4 address, and anything
 * else as the shared unknown bucket.
 */
export function addressKey(raw: string | null): string {
  const text = raw?.trim() ?? "";
  if (text === "") return UNKNOWN_ADDRESS;
  if (IPV4.test(text)) return text;
  const groups = ipv6Groups(text);
  if (!groups) return UNKNOWN_ADDRESS;
  const mapped = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mapped) {
    const [high, low] = [groups[6] ?? 0, groups[7] ?? 0];
    return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
  }
  return groups.slice(0, 4).map((group) => group.toString(16)).join(":") + "::/64";
}

/** The counted address of a request. */
export function clientAddressKey(request: Request): string {
  return addressKey(request.headers.get(CLIENT_ADDRESS_HEADER));
}
