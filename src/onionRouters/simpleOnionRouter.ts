import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import http from "http";
import { generateRsaKeyPair, exportPubKey, exportPrvKey } from "../crypto";

// implement a basic express server that listens on the port BASE_ONION_ROUTER_PORT + nodeId

// Initialize variables to store last received message and destination
let lastReceivedEncryptedMessage = null as string | null;
let lastReceivedDecryptedMessage = null as string | null;
let lastMessageDestination = null as number | null;


export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  const { publicKey, privateKey } = await generateRsaKeyPair();

  let privateKeyBase64 = await exportPrvKey(privateKey);
  let pubKeyBase64 = await exportPubKey(publicKey);
  const nodedata = JSON.stringify({ nodeId, pubKey: pubKeyBase64, privKey: privateKeyBase64 });

  const options = {
    hostname: 'localhost',
    port: REGISTRY_PORT,
    path: '/registerNode',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': nodedata.length,
    },
  };

  // Sending registration data to registry
  const req = http.request(options, (res) => {
    res.on('data', (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });
  req.write(nodedata);
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

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
