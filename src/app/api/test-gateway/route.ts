// src/app/api/test-gateway/route.ts - Clean Rebuild
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the domain from the request
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  const results = {
    gateway: "CCIP-Read Gateway Test",
    domain: host,
    baseUrl,
    registry: "0xa2bbe9b6a4ca01806b1cfac4174e4976ce2b0d70",
    resolver: "0x20cb27a5f5c77968650aaaa66e11ba9334689068",
    network: "Base Mainnet",
    tests: {} as any,
    gatewayUrl: `${baseUrl}/api/ccip-read/{sender}/{data}`,
    timestamp: new Date().toISOString(),
    instructions: [] as string[],
  };

  // Test 1: Check if alice profile exists
  try {
    const response = await fetch(`${baseUrl}/api/ccip-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
        method: "getProfile",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      results.tests.aliceProfile = {
        status: "success",
        data: data,
      };
    } else {
      const errorText = await response.text();
      results.tests.aliceProfile = {
        status: "error",
        httpStatus: response.status,
        error: errorText,
      };
    }
  } catch (error) {
    results.tests.aliceProfile = {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 2: Check if alice address resolves
  try {
    const response = await fetch(`${baseUrl}/api/ccip-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
        method: "getAddress",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      results.tests.aliceAddress = {
        status: "success",
        data: data,
      };
    } else {
      const errorText = await response.text();
      results.tests.aliceAddress = {
        status: "error",
        httpStatus: response.status,
        error: errorText,
      };
    }
  } catch (error) {
    results.tests.aliceAddress = {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 3: Check text record
  try {
    const response = await fetch(`${baseUrl}/api/ccip-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
        method: "getText",
        key: "description",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      results.tests.aliceDescription = {
        status: "success",
        data: data,
      };
    } else {
      const errorText = await response.text();
      results.tests.aliceDescription = {
        status: "error",
        httpStatus: response.status,
        error: errorText,
      };
    }
  } catch (error) {
    results.tests.aliceDescription = {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Test 4: Check AI topics
  try {
    const response = await fetch(`${baseUrl}/api/ccip-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
        method: "getText",
        key: "ai.topics",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      results.tests.aliceTopics = {
        status: "success",
        data: data,
      };
    } else {
      const errorText = await response.text();
      results.tests.aliceTopics = {
        status: "error",
        httpStatus: response.status,
        error: errorText,
      };
    }
  } catch (error) {
    results.tests.aliceTopics = {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Add instructions based on test results
  const hasAlice = results.tests.aliceProfile?.status === "success";

  results.instructions = hasAlice
    ? [
        "✅ Alice profile found!",
        "1. Connect contx.eth to resolver via ENS Manager App",
        '2. Test ENS resolution: provider.resolveName("alice.contx.eth")',
        "3. Add more AI context fields if needed",
      ]
    : [
        "❌ Alice profile not found",
        '1. Register alice: register("alice", "Alice Smith", "Web3 developer")',
        '2. Add fields: updateField("alice", "description", "Building on Base")',
        '3. Add AI context: updateField("alice", "ai.topics", "web3,ai,base")',
        "4. Then test again",
      ];

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "Test Gateway - Use GET method",
    usage: "GET /api/test-gateway",
  });
}
