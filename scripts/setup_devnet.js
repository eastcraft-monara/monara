const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } = require("@solana/web3.js");
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require("@solana/spl-token");
const bs58 = require("bs58");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

async function run() {
  const userPubkeyStr = process.argv[2];
  if (!userPubkeyStr) {
    console.error("❌ Please provide your Phantom wallet address as an argument.");
    console.error("Example: node scripts/setup_devnet.js <your_phantom_address>");
    process.exit(1);
  }

  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const userPubkey = new PublicKey(userPubkeyStr);

  let feeWallet;
  const privateKeyString = process.env.FEE_WALLET_PRIVATE_KEY;
  if (privateKeyString) {
    const secretKey = bs58.default ? bs58.default.decode(privateKeyString) : bs58.decode(privateKeyString);
    feeWallet = Keypair.fromSecretKey(secretKey);
    console.log("✅ Using FEE_WALLET from .env.local:", feeWallet.publicKey.toBase58());
  } else {
    feeWallet = Keypair.generate();
    console.log("⚠️ FEE_WALLET_PRIVATE_KEY not found. Generating a new wallet...");
    console.log("New address:", feeWallet.publicKey.toBase58());
  }

  // 1. Airdrop SOL to Fee Wallet
  console.log("⏳ Requesting Devnet SOL Airdrop for Fee Wallet...");
  try {
    const signature = await connection.requestAirdrop(feeWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature);
    console.log("✅ 2 SOL Airdrop successful.");
  } catch (err) {
    console.log("⚠️ SOL Airdrop failed (possibly faucet limit). Ensure Fee wallet has balance.");
  }

  // 2. Create MONARA Mock Token
  console.log("⏳ Creating Mock $MONARA Token...");
  const mint = await createMint(
    connection,
    feeWallet,           // payer
    feeWallet.publicKey, // mintAuthority
    null,                // freezeAuthority
    6                    // decimals
  );
  console.log("✅ Token successfully created! Token CA:", mint.toBase58());

  // Create Fee Wallet ATA explicitly
  console.log("⏳ Creating ATA for Fee Wallet...");
  await getOrCreateAssociatedTokenAccount(
    connection,
    feeWallet,
    mint,
    feeWallet.publicKey
  );

  // 3. Mint Token to User's Wallet
  console.log(`⏳ Minting 1,000,000 MONARA to your wallet (${userPubkeyStr})...`);
  const userAta = await getOrCreateAssociatedTokenAccount(
    connection,
    feeWallet,
    mint,
    userPubkey
  );
  
  await mintTo(
    connection,
    feeWallet,
    mint,
    userAta.address,
    feeWallet,
    1000000 * Math.pow(10, 6)
  );
  console.log("✅ 1,000,000 MONARA successfully minted to your wallet!");

  // 4. Update .env.local
  const envPath = path.join(__dirname, "../.env.local");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

  // Regex to replace or append
  const replaceOrAppend = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `\n${key}="${value}"`;
    }
  };

  replaceOrAppend("NEXT_PUBLIC_TOKEN_CA", mint.toBase58());
  if (!privateKeyString) {
    let secretStr;
    if (bs58.default) {
        secretStr = bs58.default.encode(feeWallet.secretKey);
    } else {
        secretStr = bs58.encode(feeWallet.secretKey);
    }
    replaceOrAppend("FEE_WALLET_PRIVATE_KEY", secretStr);
    replaceOrAppend("NEXT_PUBLIC_FEE_WALLET_ADDRESS", feeWallet.publicKey.toBase58());
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("✅ .env.local file has been updated with the new Token CA!");
  console.log("\n🎉 SETUP COMPLETE! Please RESTART your Next.js and Node servers and enjoy testing PvP!");
}

run().catch(console.error);
