import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { generateRsaKeyPair, exportPubKey, exportPrvKey, rsaDecrypt, symDecrypt, importPrvKey } from "../crypto";
// implement a basic express server that listens on the port BASE_ONION_ROUTER_PORT + nodeId

// Initialize variables to store last received message and destination
let lastReceivedEncryptedMessage = null as string | null;
let lastReceivedDecryptedMessage = null as string | null;
let lastMessageDestination = null as number | null;
let lastMessageSource = null as number | null;

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  const keyPair = await generateRsaKeyPair();
  const publicKey = await exportPubKey(keyPair.publicKey);
  const privateKey = await exportPrvKey(keyPair.privateKey);

  // implement the status route
  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: lastReceivedEncryptedMessage });
  });

  onionRouter.get("/getLastReceivedDecryptedMessage", (req, res) => {
    res.json({ result: lastReceivedDecryptedMessage });
  });

  onionRouter.get("/getLastMessageDestination", (req, res) => {
    res.json({ result: lastMessageDestination });
  });

  onionRouter.get("/getLastMessageSource", (req, res) => {
    res.json({ result: lastMessageSource });
  });

  onionRouter.get("/getPrivateKey", (req, res) => {
    res.json({ result: privateKey });
  });

  onionRouter.post("/message", async (req, res) => {
    const layer = req.body.message;

    const encryptedSymKey = layer.slice(0, 344);
    const symKey = privateKey ? await rsaDecrypt(encryptedSymKey, await importPrvKey(privateKey)) : null;
    const encryptedMessage = layer.slice(344);
    const message = symKey ? await symDecrypt(symKey, encryptedMessage) : null;
    
    lastReceivedEncryptedMessage = layer;
    lastReceivedDecryptedMessage = message ? message.slice(10) : null;
    lastMessageSource = nodeId;
    lastMessageDestination = message ? parseInt(message.slice(0, 10), 10) : null;
    
    if (lastMessageDestination) {
      await fetch(`http://localhost:${lastMessageDestination}/message`, {
        method: "POST",
        body: JSON.stringify({ message: lastReceivedDecryptedMessage }),
        headers: { "Content-Type": "application/json" },
      });
    }
    res.send("success");
  });

  const response = await fetch(`http://localhost:${REGISTRY_PORT}/registerNode`, {
    method: "POST",
    body: JSON.stringify({ nodeId: nodeId, pubKey: publicKey }),
    headers: { "Content-Type": "application/json" },
  });
  console.log(await response.json());
  
  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
