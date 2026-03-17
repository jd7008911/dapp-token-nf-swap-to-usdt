<script setup lang="ts">
import { ref } from "vue";
import { JsonRpcProvider, Contract, formatUnits, parseUnits, getAddress } from "ethers";
import { TOKEN_ABI, TOKEN_ADDRESS, USDT_ADDRESS, SWAP_ADDRESS, USDT_ABI, SWAP_ABI, HARDHAT_RPC_URL } from "./contracts/token";

const connected = ref(false);
const account = ref("");
const balance = ref("0");
const accountUSDTBalance = ref("0");
const ethBalance = ref("0");
const tokenName = ref("");
const tokenSymbol = ref("");
const totalSupply = ref("");
const statusMessage = ref("");
const isLoading = ref(false);
const contractAddress = ref(TOKEN_ADDRESS);
const accounts = ref<string[]>([]);

// Transfer form
const fromAddress = ref("");
const toAddress = ref("0x2746E95D04c1A508B1e0618E62709208ab772f7E");
const transferAmount = ref("100");

// Balance check
const checkAddress = ref("");
const checkedBalance = ref("");

// Approve form
const approveOwner = ref("");
const approveSpender = ref("");
const approveAmount = ref("1000");

// Check allowance
const allowanceOwner = ref("");
const allowanceSpender = ref("");
const checkedAllowance = ref("");

// Swap form
const swapDirection = ref("NF_TO_USDT");
const swapAmount = ref("100");
const swapPreview = ref("");
const swapFrom = ref("");
const poolNF = ref("0");
const poolUSDT = ref("0");
const swapRate = ref("0");
const userUSDTBalance = ref("0");

// Withdraw USDT form
const withdrawFrom = ref("");
const withdrawTo = ref("0xCE1677690beB7769959ceF64BeF0AAa926C051e3");
const withdrawAmount = ref("100");
const withdrawUSDTBalance = ref("0");

// Swap transaction history
interface SwapTx {
  id: number;
  time: string;
  from: string;
  direction: string;
  amountIn: string;
  amountOut: string;
  txHash: string;
}
const swapTxHistory = ref<SwapTx[]>([]);
let swapTxCounter = 0;

// Direct connection to Hardhat node — no MetaMask needed
const provider = new JsonRpcProvider(HARDHAT_RPC_URL);
let contract: Contract;
let usdtContract: Contract;
let swapContract: Contract;

async function connect() {
  try {
    isLoading.value = true;
    statusMessage.value = "Connecting to Hardhat node...";

    // Get all Hardhat accounts
    const signers = await provider.listAccounts();
    accounts.value = signers.map((s) => s.address);
    account.value = accounts.value[0]; // default to Account #0 (deployer)
    fromAddress.value = accounts.value[0];
    approveOwner.value = accounts.value[0];

    // Connect contract with signer
    const signer = await provider.getSigner(account.value);
    contract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    usdtContract = new Contract(USDT_ADDRESS, USDT_ABI, signer);
    swapContract = new Contract(SWAP_ADDRESS, SWAP_ABI, signer);

    // Load token info
    tokenName.value = await contract.name();
    tokenSymbol.value = await contract.symbol();
    const decimals = Number(await contract.decimals());
    totalSupply.value = formatUnits(await contract.totalSupply(), decimals);

    await refreshBalance();
    await loadPoolInfo();
    swapFrom.value = accounts.value[0];
    withdrawFrom.value = accounts.value[0];
    await loadUserUSDTBalance();
    await loadWithdrawUSDTBalance();
    connected.value = true;
    statusMessage.value = "Connected to Hardhat node!";
  } catch (err: any) {
    statusMessage.value = "Connection failed: " + (err.reason || err.message);
  } finally {
    isLoading.value = false;
  }
}

async function switchAccount() {
  const signer = await provider.getSigner(account.value);
  contract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  await refreshBalance();
  statusMessage.value = `Switched to ${account.value.slice(0, 10)}...`;
}

async function refreshBalance() {
  if (!contract || !account.value) return;
  const decimals = Number(await contract.decimals());
  balance.value = formatUnits(await contract.balanceOf(account.value), decimals);
  ethBalance.value = formatUnits(await provider.getBalance(account.value), 18);
  if (usdtContract) {
    accountUSDTBalance.value = formatUnits(await usdtContract.balanceOf(account.value), 6);
  }
}

async function transferTokens() {
  if (!fromAddress.value) return;

  try {
    isLoading.value = true;
    statusMessage.value = "Sending transaction...";

    const signer = await provider.getSigner(fromAddress.value);
    const senderContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    const decimals = Number(await senderContract.decimals());
    const amount = parseUnits(String(transferAmount.value), decimals);
    const tx = await senderContract.transfer(toAddress.value, amount);

    statusMessage.value = "Waiting for confirmation...";
    await tx.wait();

    statusMessage.value = `Transferred ${transferAmount.value} ${tokenSymbol.value} to ${toAddress.value}`;
    await refreshBalance();
  } catch (err: any) {
    statusMessage.value = "Transfer failed: " + (err.reason || err.message);
  } finally {
    isLoading.value = false;
  }
}

async function checkBalance() {
  if (!contract || !checkAddress.value) return;

  try {
    const decimals = Number(await contract.decimals());
    checkedBalance.value = formatUnits(
      await contract.balanceOf(checkAddress.value),
      decimals
    );
  } catch (err: any) {
    checkedBalance.value = "Error: " + (err.reason || err.message);
  }
}

async function approveTokens() {
  if (!approveOwner.value || !approveSpender.value) return;

  try {
    isLoading.value = true;
    statusMessage.value = "Approving...";

    const signer = await provider.getSigner(approveOwner.value);
    const ownerContract = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

    const decimals = Number(await ownerContract.decimals());
    const amount = parseUnits(String(approveAmount.value), decimals);
    const tx = await ownerContract.approve(approveSpender.value, amount);
    await tx.wait();

    statusMessage.value = `Approved ${approveAmount.value} ${tokenSymbol.value} for ${approveSpender.value.slice(0, 10)}...`;
  } catch (err: any) {
    statusMessage.value = "Approve failed: " + (err.reason || err.message);
  } finally {
    isLoading.value = false;
  }
}

async function checkAllowance() {
  if (!contract || !allowanceOwner.value || !allowanceSpender.value) return;

  try {
    const decimals = Number(await contract.decimals());
    checkedAllowance.value = formatUnits(
      await contract.allowance(allowanceOwner.value, allowanceSpender.value),
      decimals
    );
  } catch (err: any) {
    checkedAllowance.value = "Error: " + (err.reason || err.message);
  }
}

// --- Withdraw USDT functions ---

async function loadWithdrawUSDTBalance() {
  if (!usdtContract || !withdrawFrom.value) return;
  try {
    withdrawUSDTBalance.value = formatUnits(await usdtContract.balanceOf(withdrawFrom.value), 6);
  } catch { /* ignore */ }
}

// Convert TRON address (T...) to Ethereum 0x address
function tronToEthAddress(tronAddr: string): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = BigInt(0);
  for (const c of tronAddr) {
    n = n * 58n + BigInt(ALPHABET.indexOf(c));
  }
  const hex = n.toString(16).padStart(50, "0"); // 25 bytes = 50 hex chars
  // Skip first byte (0x41 TRON prefix) and last 4 bytes (checksum)
  return "0x" + hex.slice(2, 42);
}

function resolveAddress(addr: string): string {
  if (addr.startsWith("T") && addr.length >= 33 && addr.length <= 34) {
    return getAddress(tronToEthAddress(addr));
  }
  return getAddress(addr);
}

async function withdrawUSDT() {
  if (!withdrawFrom.value || !withdrawTo.value || !withdrawAmount.value) return;

  try {
    isLoading.value = true;
    statusMessage.value = "Sending USDT...";

    const signer = await provider.getSigner(withdrawFrom.value);
    const usdtWithSigner = new Contract(USDT_ADDRESS, USDT_ABI, signer);

    const amount = parseUnits(String(withdrawAmount.value), 6);
    const checksumTo = resolveAddress(withdrawTo.value);
    const tx = await usdtWithSigner.transfer(checksumTo, amount);
    await tx.wait();

    statusMessage.value = `Sent ${withdrawAmount.value} USDT to ${checksumTo}`;
    await loadWithdrawUSDTBalance();
    await loadUserUSDTBalance();
    await refreshBalance();
  } catch (err: any) {
    statusMessage.value = "Withdraw failed: " + (err.reason || err.message);
  } finally {
    isLoading.value = false;
  }
}

// --- Swap functions ---

async function loadPoolInfo() {
  if (!swapContract) return;
  try {
    const nfBal = await swapContract.poolNFBalance();
    const usdtBal = await swapContract.poolUSDTBalance();
    const r = await swapContract.rate();
    poolNF.value = formatUnits(nfBal, 18);
    poolUSDT.value = formatUnits(usdtBal, 6);
    swapRate.value = formatUnits(r, 6);
  } catch (err: any) {
    console.error("Failed to load pool info:", err);
  }
}

async function loadUserUSDTBalance() {
  if (!usdtContract || !swapFrom.value) return;
  try {
    userUSDTBalance.value = formatUnits(await usdtContract.balanceOf(swapFrom.value), 6);
  } catch { /* ignore */ }
}

async function previewSwap() {
  if (!swapContract || !swapAmount.value || Number(swapAmount.value) <= 0) {
    swapPreview.value = "";
    return;
  }
  try {
    if (swapDirection.value === "NF_TO_USDT") {
      const nfWei = parseUnits(String(swapAmount.value), 18);
      const usdtOut = await swapContract.getUSDTAmount(nfWei);
      swapPreview.value = formatUnits(usdtOut, 6) + " USDT";
    } else {
      const usdtWei = parseUnits(String(swapAmount.value), 6);
      const nfOut = await swapContract.getNFAmount(usdtWei);
      swapPreview.value = formatUnits(nfOut, 18) + " NF";
    }
  } catch (err: any) {
    swapPreview.value = "Error: " + (err.reason || err.message);
  }
}

async function executeSwap() {
  if (!swapFrom.value || !swapAmount.value) return;

  try {
    isLoading.value = true;
    const signer = await provider.getSigner(swapFrom.value);
    const swapWithSigner = new Contract(SWAP_ADDRESS, SWAP_ABI, signer);

    if (swapDirection.value === "NF_TO_USDT") {
      const nfWei = parseUnits(String(swapAmount.value), 18);

      // Step 1: Approve the swap contract to spend NF
      statusMessage.value = "Approving NF for swap...";
      const nfWithSigner = new Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const approveTx = await nfWithSigner.approve(SWAP_ADDRESS, nfWei);
      await approveTx.wait();

      // Step 2: Execute swap
      statusMessage.value = "Swapping NF → USDT...";
      const tx = await swapWithSigner.swapNFtoUSDT(nfWei);
      await tx.wait();

      const usdtOut = await swapContract.getUSDTAmount(nfWei);
      const outStr = formatUnits(usdtOut, 6);
      statusMessage.value = `Swapped ${swapAmount.value} NF → ${outStr} USDT`;
      swapTxHistory.value.unshift({
        id: ++swapTxCounter,
        time: new Date().toLocaleTimeString(),
        from: swapFrom.value,
        direction: "NF → USDT",
        amountIn: swapAmount.value + " NF",
        amountOut: outStr + " USDT",
        txHash: tx.hash,
      });
    } else {
      const usdtWei = parseUnits(String(swapAmount.value), 6);

      // Step 1: Approve the swap contract to spend USDT
      statusMessage.value = "Approving USDT for swap...";
      const usdtWithSigner = new Contract(USDT_ADDRESS, USDT_ABI, signer);
      const approveTx = await usdtWithSigner.approve(SWAP_ADDRESS, usdtWei);
      await approveTx.wait();

      // Step 2: Execute swap
      statusMessage.value = "Swapping USDT → NF...";
      const tx = await swapWithSigner.swapUSDTtoNF(usdtWei);
      await tx.wait();

      const nfOut = await swapContract.getNFAmount(usdtWei);
      const outStr = formatUnits(nfOut, 18);
      statusMessage.value = `Swapped ${swapAmount.value} USDT → ${outStr} NF`;
      swapTxHistory.value.unshift({
        id: ++swapTxCounter,
        time: new Date().toLocaleTimeString(),
        from: swapFrom.value,
        direction: "USDT → NF",
        amountIn: swapAmount.value + " USDT",
        amountOut: outStr + " NF",
        txHash: tx.hash,
      });
    }

    await loadPoolInfo();
    await loadUserUSDTBalance();
    await refreshBalance();
  } catch (err: any) {
    statusMessage.value = "Swap failed: " + (err.reason || err.message);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="app">
    <h1>Nacjia Fog Token (NF)</h1>
    <p class="contract-addr">Contract: {{ contractAddress }}</p>
    <p class="network-badge">Local Hardhat Network</p>

    <!-- Connect -->
    <div v-if="!connected" class="card">
      <button @click="connect" :disabled="isLoading">
        {{ isLoading ? "Connecting..." : "Connect to Hardhat" }}
      </button>
    </div>

    <!-- Account Selector -->
    <div v-if="connected" class="card">
      <h2>Account</h2>
      <div class="form-group">
        <label>Select Hardhat Account:</label>
        <select v-model="account" @change="switchAccount">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>
      <p><strong>Address:</strong> {{ account }}</p>
      <p><strong>ETH Balance:</strong> {{ Number(ethBalance).toFixed(4) }} ETH</p>
      <p><strong>NF Balance:</strong> {{ balance }} NF</p>
      <p><strong>USDT Balance:</strong> {{ accountUSDTBalance }} USDT</p>
      <button @click="refreshBalance" class="small">Refresh</button>
    </div>

    <!-- Token Info -->
    <div v-if="connected" class="card">
      <h2>Token Info</h2>
      <p><strong>Name:</strong> {{ tokenName }}</p>
      <p><strong>Symbol:</strong> {{ tokenSymbol }}</p>
      <p><strong>Total Supply:</strong> {{ totalSupply }} {{ tokenSymbol }}</p>
    </div>

    <!-- Transfer -->
    <div v-if="connected" class="card">
      <h2>Transfer Tokens</h2>
      <div class="form-group">
        <label>From Address:</label>
        <select v-model="fromAddress">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>To Address:</label>
        <select v-model="toAddress">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount ({{ tokenSymbol }}):</label>
        <input v-model="transferAmount" type="number" min="0" step="any" />
      </div>
      <button @click="transferTokens" :disabled="isLoading">
        {{ isLoading ? "Sending..." : "Transfer" }}
      </button>
    </div>

    <!-- Check Balance -->
    <div v-if="connected" class="card">
      <h2>Check Balance</h2>
      <div class="form-group">
        <label>Address:</label>
        <input v-model="checkAddress" placeholder="0x..." />
      </div>
      <button @click="checkBalance" class="small">Check</button>
      <p v-if="checkedBalance">
        <strong>Balance:</strong> {{ checkedBalance }} {{ tokenSymbol }}
      </p>
    </div>

    <!-- Approve -->
    <div v-if="connected" class="card">
      <h2>Approve Spender</h2>
      <div class="form-group">
        <label>Owner (who approves):</label>
        <select v-model="approveOwner">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Spender (who can spend):</label>
        <select v-model="approveSpender">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount ({{ tokenSymbol }}):</label>
        <input v-model="approveAmount" type="number" min="0" step="any" />
      </div>
      <button @click="approveTokens" :disabled="isLoading">
        {{ isLoading ? "Approving..." : "Approve" }}
      </button>
    </div>

    <!-- Check Allowance -->
    <div v-if="connected" class="card">
      <h2>Check Allowance</h2>
      <div class="form-group">
        <label>Owner:</label>
        <input v-model="allowanceOwner" placeholder="0x..." />
      </div>
      <div class="form-group">
        <label>Spender:</label>
        <input v-model="allowanceSpender" placeholder="0x..." />
      </div>
      <button @click="checkAllowance" class="small">Check</button>
      <p v-if="checkedAllowance">
        <strong>Allowance:</strong> {{ checkedAllowance }} {{ tokenSymbol }}
      </p>
    </div>

    <!-- Withdraw USDT -->
    <div v-if="connected" class="card withdraw-card">
      <h2>Withdraw USDT</h2>
      <p class="withdraw-hint">Send USDT to any wallet address</p>

      <div class="form-group">
        <label>From (Hardhat Account):</label>
        <select v-model="withdrawFrom" @change="loadWithdrawUSDTBalance">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
        <p class="balance-hint">Available: {{ withdrawUSDTBalance }} USDT</p>
      </div>

      <div class="form-group">
        <label>To (Wallet Address):</label>
        <input v-model="withdrawTo" placeholder="0x... (paste your real wallet address)" />
      </div>

      <div class="form-group">
        <label>Amount (USDT):</label>
        <input v-model="withdrawAmount" type="number" min="0" step="any" />
      </div>

      <button @click="withdrawUSDT" :disabled="isLoading" class="withdraw-btn">
        {{ isLoading ? 'Sending...' : 'Send USDT' }}
      </button>
    </div>

    <!-- Swap NF ↔ USDT -->
    <div v-if="connected" class="card swap-card">
      <h2>Swap NF ↔ USDT</h2>
      <p class="swap-info">Pool: {{ poolNF }} NF | {{ poolUSDT }} USDT | Rate: 1 NF = {{ swapRate }} USDT</p>

      <div class="form-group">
        <label>Swap From (Account):</label>
        <select v-model="swapFrom" @change="loadUserUSDTBalance">
          <option v-for="(addr, i) in accounts" :key="addr" :value="addr">
            #{{ i }} — {{ addr.slice(0, 10) }}...{{ addr.slice(-8) }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Direction:</label>
        <div class="direction-toggle">
          <button
            :class="['toggle-btn', { active: swapDirection === 'NF_TO_USDT' }]"
            @click="swapDirection = 'NF_TO_USDT'; previewSwap()"
          >NF → USDT</button>
          <button
            :class="['toggle-btn', { active: swapDirection === 'USDT_TO_NF' }]"
            @click="swapDirection = 'USDT_TO_NF'; previewSwap()"
          >USDT → NF</button>
        </div>
      </div>

      <div class="form-group">
        <label>Amount ({{ swapDirection === 'NF_TO_USDT' ? 'NF' : 'USDT' }}):</label>
        <input v-model="swapAmount" type="number" min="0" step="any" @input="previewSwap" />
      </div>

      <p v-if="swapPreview" class="preview">You receive: <strong>{{ swapPreview }}</strong></p>
      <p v-if="swapFrom" class="balance-hint">Your USDT: {{ userUSDTBalance }}</p>

      <button @click="executeSwap" :disabled="isLoading" class="swap-btn">
        {{ isLoading ? "Swapping..." : "Swap" }}
      </button>
    </div>

    <!-- Swap Transaction History -->
    <div v-if="connected && swapTxHistory.length > 0" class="card swap-card">
      <h2>Swap Transactions</h2>
      <div class="tx-list">
        <div v-for="tx in swapTxHistory" :key="tx.id" class="tx-row">
          <div class="tx-header">
            <span class="tx-time">{{ tx.time }}</span>
            <span class="tx-direction">{{ tx.direction }}</span>
          </div>
          <div class="tx-amounts">
            <span class="tx-in">{{ tx.amountIn }}</span>
            <span class="tx-arrow">→</span>
            <span class="tx-out">{{ tx.amountOut }}</span>
          </div>
          <div class="tx-details">
            <span class="tx-account">Account: {{ tx.from.slice(0, 8) }}...{{ tx.from.slice(-6) }}</span>
            <span class="tx-hash">Tx: {{ tx.txHash.slice(0, 10) }}...{{ tx.txHash.slice(-6) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status -->
    <p v-if="statusMessage" class="status">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
.app {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.contract-addr {
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  word-break: break-all;
}

.network-badge {
  text-align: center;
  font-size: 0.8rem;
  color: #4fc3f7;
  font-weight: bold;
  margin-bottom: 1rem;
}

.card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

h2 {
  margin-top: 0;
  font-size: 1.2rem;
  color: #e0e0e0;
}

p {
  margin: 0.5rem 0;
  word-break: break-all;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.9rem;
  color: #aaa;
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #16213e;
  color: #fff;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  background: #646cff;
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 0.5rem;
}

button:hover {
  background: #535bf2;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.small {
  width: auto;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
}

.status {
  text-align: center;
  padding: 0.8rem;
  background: #0f3460;
  border-radius: 8px;
  font-size: 0.9rem;
}

select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #16213e;
  color: #fff;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.swap-card {
  border: 1px solid #646cff;
}

.swap-info {
  font-size: 0.8rem;
  color: #aaa;
  text-align: center;
}

.direction-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  flex: 1;
  background: #16213e;
  border: 1px solid #333;
  color: #aaa;
  padding: 0.5rem;
  font-size: 0.9rem;
  margin-top: 0;
}

.toggle-btn.active {
  background: #646cff;
  color: #fff;
  border-color: #646cff;
}

.preview {
  text-align: center;
  color: #4fc3f7;
  font-size: 1.1rem;
}

.balance-hint {
  font-size: 0.8rem;
  color: #888;
  text-align: center;
}

.swap-btn {
  background: #00c853;
}

.swap-btn:hover {
  background: #00a844;
}

.withdraw-card {
  border: 1px solid #ff9800;
}

.withdraw-hint {
  font-size: 0.8rem;
  color: #aaa;
  text-align: center;
}

.withdraw-btn {
  background: #ff9800;
}

.withdraw-btn:hover {
  background: #f57c00;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tx-row {
  background: #16213e;
  border-radius: 8px;
  padding: 0.75rem;
  border-left: 3px solid #646cff;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
}

.tx-time {
  font-size: 0.75rem;
  color: #888;
}

.tx-direction {
  font-size: 0.8rem;
  font-weight: bold;
  color: #4fc3f7;
}

.tx-amounts {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-bottom: 0.3rem;
}

.tx-in {
  color: #ff8a80;
}

.tx-arrow {
  color: #666;
}

.tx-out {
  color: #69f0ae;
  font-weight: bold;
}

.tx-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #666;
}

.tx-hash {
  font-family: monospace;
}
</style>
