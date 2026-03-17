import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

// Mock ethers BEFORE importing the component
vi.mock("ethers", () => import("../__mocks__/ethers"));

// Dynamically import so the mock is in place first
const { default: App } = await import("../App.vue");

// ── helpers ────────────────────────────────────────────────────────

/** Mount the component and wait for reactivity to settle */
async function mountApp() {
  const wrapper = mount(App);
  await flushPromises();
  return wrapper;
}

/** Click the "Connect to Hardhat" button and wait for async effects */
async function connectApp(wrapper: ReturnType<typeof mount>) {
  const btn = wrapper.find("button");
  expect(btn.text()).toContain("Connect to Hardhat");
  await btn.trigger("click");
  await flushPromises();
  return wrapper;
}

// ════════════════════════════════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════════════════════════════════

describe("App.vue — Disconnected State", () => {
  it("renders the app title", async () => {
    const wrapper = await mountApp();
    expect(wrapper.find("h1").text()).toContain("Nacjia Fog Token");
  });

  it("shows the Connect button when not connected", async () => {
    const wrapper = await mountApp();
    const btn = wrapper.find("button");
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain("Connect to Hardhat");
  });

  it("displays the contract address", async () => {
    const wrapper = await mountApp();
    expect(wrapper.text()).toContain("Contract:");
  });

  it("shows the network badge", async () => {
    const wrapper = await mountApp();
    expect(wrapper.find(".network-badge").text()).toBe("Local Hardhat Network");
  });

  it("does NOT show account section before connecting", async () => {
    const wrapper = await mountApp();
    expect(wrapper.findAll("h2").map((h) => h.text())).not.toContain("Account");
  });
});

describe("App.vue — Connection Flow", () => {
  it("shows Account card after connecting", async () => {
    const wrapper = await mountApp();
    await connectApp(wrapper);

    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Account");
    expect(headings).toContain("Token Info");
  });

  it("displays token info after connecting", async () => {
    const wrapper = await mountApp();
    await connectApp(wrapper);

    expect(wrapper.text()).toContain("Nacjia Fog");
    expect(wrapper.text()).toContain("NF");
  });

  it("populates the account selector with mock accounts", async () => {
    const wrapper = await mountApp();
    await connectApp(wrapper);

    const options = wrapper.findAll("select option");
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it("shows status message after connection", async () => {
    const wrapper = await mountApp();
    await connectApp(wrapper);

    expect(wrapper.find(".status").text()).toContain("Connected to Hardhat node");
  });
});

describe("App.vue — Connected UI Sections", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(async () => {
    wrapper = await mountApp();
    await connectApp(wrapper);
  });

  it("renders Transfer Tokens section", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Transfer Tokens");
  });

  it("renders Check Balance section", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Check Balance");
  });

  it("renders Approve Spender section", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Approve Spender");
  });

  it("renders Check Allowance section", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Check Allowance");
  });

  it("renders Withdraw USDT section", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Withdraw USDT");
  });

  it("renders Swap NF ↔ USDT section", () => {
    const text = wrapper.text();
    expect(text).toContain("Swap NF");
    expect(text).toContain("USDT");
  });

  it("shows pool info in swap section", () => {
    const text = wrapper.text();
    expect(text).toContain("Pool:");
    expect(text).toContain("Rate:");
  });

  it("has NF → USDT and USDT → NF toggle buttons", () => {
    const toggleBtns = wrapper.findAll(".toggle-btn");
    expect(toggleBtns.length).toBe(2);
    expect(toggleBtns[0].text()).toContain("NF");
    expect(toggleBtns[1].text()).toContain("USDT");
  });

  it("does NOT show swap history when no swaps have occurred", () => {
    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).not.toContain("Swap Transactions");
  });
});

describe("App.vue — Transfer Form", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(async () => {
    wrapper = await mountApp();
    await connectApp(wrapper);
  });

  it("pre-fills the Transfer amount input", () => {
    const inputs = wrapper.findAll('input[type="number"]');
    const transferInput = inputs[0];
    expect((transferInput.element as HTMLInputElement).value).toBe("100");
  });

  it("has a Transfer button", () => {
    const buttons = wrapper.findAll("button");
    const transferBtn = buttons.find((b) => b.text() === "Transfer");
    expect(transferBtn).toBeDefined();
  });

  it("clicking Transfer triggers the transfer flow", async () => {
    const buttons = wrapper.findAll("button");
    const transferBtn = buttons.find((b) => b.text() === "Transfer");
    await transferBtn!.trigger("click");
    await flushPromises();

    // Status message should update
    const status = wrapper.find(".status").text();
    expect(status).toMatch(/Transferred|Sending|Transfer/);
  });
});

describe("App.vue — Approve & Allowance", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(async () => {
    wrapper = await mountApp();
    await connectApp(wrapper);
  });

  it("has an Approve button", () => {
    const buttons = wrapper.findAll("button");
    const approveBtn = buttons.find((b) => b.text() === "Approve");
    expect(approveBtn).toBeDefined();
  });

  it("has a Check (allowance) button", () => {
    const buttons = wrapper.findAll("button");
    const checkBtns = buttons.filter((b) => b.text() === "Check");
    expect(checkBtns.length).toBeGreaterThanOrEqual(1);
  });
});

describe("App.vue — Swap Section", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(async () => {
    wrapper = await mountApp();
    await connectApp(wrapper);
  });

  it("has a Swap button", () => {
    const buttons = wrapper.findAll("button");
    const swapBtn = buttons.find((b) => b.text() === "Swap");
    expect(swapBtn).toBeDefined();
  });

  it("clicking Swap executes the swap flow", async () => {
    const buttons = wrapper.findAll("button");
    const swapBtn = buttons.find((b) => b.text() === "Swap");
    await swapBtn!.trigger("click");
    await flushPromises();

    const status = wrapper.find(".status").text();
    expect(status).toMatch(/Swap|swap/);
  });

  it("swap transaction appears in history after successful swap", async () => {
    const buttons = wrapper.findAll("button");
    const swapBtn = buttons.find((b) => b.text() === "Swap");
    await swapBtn!.trigger("click");
    await flushPromises();

    const headings = wrapper.findAll("h2").map((h) => h.text());
    expect(headings).toContain("Swap Transactions");
    expect(wrapper.findAll(".tx-row").length).toBe(1);
  });
});

describe("App.vue — Withdraw USDT", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(async () => {
    wrapper = await mountApp();
    await connectApp(wrapper);
  });

  it("renders the Send USDT button", () => {
    const buttons = wrapper.findAll("button");
    const sendBtn = buttons.find((b) => b.text() === "Send USDT");
    expect(sendBtn).toBeDefined();
  });

  it("shows 'Available:' USDT balance hint", () => {
    expect(wrapper.text()).toContain("Available:");
  });

  it("clicking Send USDT triggers withdraw flow", async () => {
    const buttons = wrapper.findAll("button");
    const sendBtn = buttons.find((b) => b.text() === "Send USDT");
    await sendBtn!.trigger("click");
    await flushPromises();

    const status = wrapper.find(".status").text();
    expect(status).toMatch(/Sent|Sending|USDT|Withdraw/i);
  });
});
