import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT } from "../config";

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

// Initialize variables to store last received message
let lastReceivedMessage = null as string | null;
let lastSentMessage = null as string | null;

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

  _user.post("/message", (req, res) => {
    const { message }: { message: string } = req.body;
    lastReceivedMessage = message;
    res.send("success");
  });
  
  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
