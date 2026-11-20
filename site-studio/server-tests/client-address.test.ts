import { describe, expect, it } from "vitest";
import { addressKey, clientAddressKey, ipv6Groups, UNKNOWN_ADDRESS } from "../server/api/clientAddress";

// The address a set-up attempt is counted under (story 1.2, CA-05; deferred item from spec 1):
// IPv4 whole, IPv6 by its /64, anything else in one shared bucket.

describe("counted client address", () => {
  it("keeps an IPv4 address whole", () => {
    expect(addressKey("198.51.100.7")).toBe("198.51.100.7");
    expect(addressKey(" 203.0.113.255 ")).toBe("203.0.113.255");
  });

  it("groups IPv6 addresses by their /64 prefix, however they are written", () => {
    const key = "2001:db8:aa:bb::/64";
    for (const address of [
      "2001:db8:aa:bb::1",
      "2001:0DB8:00AA:00BB:0000:0000:0000:0001",
      "2001:db8:aa:bb:ffff:ffff:ffff:ffff",
      "2001:db8:aa:bb:1:2:3:4",
      "2001:db8:aa:bb::",
      "2001:db8:aa:bb::1%eth0",
    ]) {
      expect(addressKey(address), address).toBe(key);
    }
    expect(addressKey("2001:db8:aa:bc::1")).toBe("2001:db8:aa:bc::/64");
    expect(addressKey("::1")).toBe("0:0:0:0::/64");
    expect(addressKey("2001:db8::")).toBe("2001:db8:0:0::/64");
  });

  it("counts an IPv4-mapped IPv6 address as its IPv4 address", () => {
    expect(addressKey("::ffff:192.0.2.10")).toBe("192.0.2.10");
    expect(addressKey("::ffff:c000:20a")).toBe("192.0.2.10");
  });

  it("puts a missing or unreadable address in the shared bucket", () => {
    for (const raw of [null, "", "   ", "not an address", "256.1.1.1", "1.2.3", "1::2::3", "12345::1", "1:2:3:4:5:6:7:8:9", ":1", "1:::2", "::ffff:999.0.0.1"]) {
      expect(addressKey(raw), String(raw)).toBe(UNKNOWN_ADDRESS);
    }
  });

  it("parses the eight groups of an IPv6 address", () => {
    expect(ipv6Groups("1:2:3:4:5:6:7:8")).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(ipv6Groups("1::8")).toEqual([1, 0, 0, 0, 0, 0, 0, 8]);
    expect(ipv6Groups("::")).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(ipv6Groups("1:2:3:4:5:6:7::8")).toBeNull();
  });

  it("reads the address from CF-Connecting-IP only", () => {
    const request = (headers: Record<string, string>) => new Request("https://survey.acme.test/", { headers });
    expect(clientAddressKey(request({ "cf-connecting-ip": "2001:db8:1:2::9" }))).toBe("2001:db8:1:2::/64");
    expect(clientAddressKey(request({ "x-forwarded-for": "198.51.100.1" }))).toBe(UNKNOWN_ADDRESS);
    expect(clientAddressKey(request({}))).toBe(UNKNOWN_ADDRESS);
  });
});
