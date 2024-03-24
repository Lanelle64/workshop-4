import bodyParser from "body-parser";
import express from "express";
import {BASE_ONION_ROUTER_PORT} from "../config";
import http from "http";
import { REGISTRY_PORT } from "../config";
import {generateRsaKeyPair, exportPubKey, exportPrvKey, rsaDecrypt, symDecrypt} from "../crypto";
// implement a basic express server that listens on the port BASE_ONION_ROUTER_PORT + nodeId

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // Initialize variables to store last received message and destination
  let lastReceivedEncryptedMessage: string | null = null;
  let lastReceivedDecryptedMessage: string | null = null;
  let lastMessageDestination: number | null = null;

  // Generate keys
  const { publicKey, privateKey } = await generateRsaKeyPair();
  let privateKeyBase64 = await exportPrvKey(privateKey);
  let pubKeyBase64 = await exportPubKey(publicKey);

  // Register the node on the registry
  const data = JSON.stringify({
    nodeId,
    pubKey: pubKeyBase64,
  });

  const options = {
    hostname: 'localhost',
    port: REGISTRY_PORT,
    path: '/registerNode',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(options, (res) => {
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });

  req.on('error', (error) => {
    console.error(`Problem with request: ${error.message}`);
  });

  // Write data to request body
  req.write(data);
  req.end();

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

  onionRouter.get("/getPrivateKey", (req, res) => {
    res.json({ result: privateKeyBase64 });
  });

  onionRouter.post("/message", async (req, res) => {
    const {message} = req.body;
    // decrypting symmetric key
    const decryptedKey = await rsaDecrypt(message.slice(0, 344), privateKey);
    // decrypting rest of the message
    const decryptedMessage = await symDecrypt(decryptedKey, message.slice(344));
    // getting next destination
    const nextDestination = parseInt(decryptedMessage.slice(0, 10), 10);
    // getting rest of the message
    const remainingMessage = decryptedMessage.slice(10);
    
    // store the encrypted message
    lastReceivedEncryptedMessage = message; 
    lastReceivedDecryptedMessage = remainingMessage;
    lastMessageDestination = nextDestination;
    // send the message to the next destination
    await fetch(`http://localhost:${nextDestination}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: remainingMessage }),
    });
    res.status(200).send("success");
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
