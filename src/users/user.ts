import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";
import { rsaDecrypt, symDecrypt, getPrivateKey } from "../crypto";

let lastReceivedMessage = null as string | null;
let lastSentMessage = null as string | null;

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // implement the status route
  _user.get("/status", (req, res) => {
    res.send("live");
  });

  _user.get("/getLastReceivedMessage", (req, res) => {
    res.json({ result: lastReceivedMessage });
  });

  _user.get("/getLastSentMessage", (req, res) => {
    res.json({ result: lastSentMessage });
  });

  //_user.post("/message", (req, res) => {
  //  const { message }: { message: string } = req.body;
  //  lastReceivedMessage = message;
  //  res.send("success");
  //});

  _user.post("/message", async (req, res) => {
    const { message } = req.body; // Retrieve the message from the request body
    
    // Retrieve the private key of the current user
    const privateKey = await getPrivateKey(userId);

    // Decrypt message components and determine the next destination
    const decryptedKey = await rsaDecrypt(message.slice(0, 344), privateKey);
    const decryptedMessage = await symDecrypt(decryptedKey, message.slice(344));
    const nextDestination = parseInt(decryptedMessage.slice(0, 10), 10);
    const remainingMessage = decryptedMessage.slice(10);

    // Store the received message
    lastReceivedMessage = remainingMessage;
    lastSentMessage = message;

    // Forward the remaining message to the next router in the chain
    await fetch(`http://localhost:${nextDestination}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: remainingMessage }),
    });
    res.status(200).send("success");
  });
  
  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
