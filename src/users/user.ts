import bodyParser from "body-parser";
import express from "express";
import {BASE_ONION_ROUTER_PORT, BASE_USER_PORT, REGISTRY_PORT} from "../config";
import {rsaEncrypt, symEncrypt, exportSymKey, createRandomSymmetricKey, importSymKey} from '../crypto';
import { Node } from '../registry/registry';
import axios from 'axios';

export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

// Initialize variables to store last received message
let lastReceivedMessage = null as string | null;
let lastSentMessage = null as string | null;
export type circuitNode={
  nodeId:number;
pubKey:string;
}
let lastCircuitNode=null as circuitNode | null;
let lastCircuit=null as circuitNode[] | null;

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

  _user.get("/getLastCircuit", (req, res) => {
    if (lastCircuit) {
        const nodeIds = lastCircuit.map(node => node.nodeId);
        res.status(200).json({result: nodeIds});
    } else {
        res.status(404).send("No circuit found");
    }
});

_user.post('/sendMessage', async (req, res) => {
    const { message, destinationUserId } = req.body;
    lastSentMessage = message;

    const response = await axios.get(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`);
    const nodes = response.data.nodes as Node[];
    let destination = String(BASE_USER_PORT + destinationUserId).padStart(10, '0');
    let encryptedMessage=message;

    const circuit: circuitNode[] = [];
    while (circuit.length < 3) {
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        if (!circuit.includes(randomNode)) {
            circuit.push(randomNode);
        }
    }
    
    for (const node of circuit) {
        const symKeyCrypto = await createRandomSymmetricKey();
        const symKeyString = await exportSymKey(symKeyCrypto);
        const symKey = await importSymKey(symKeyString);
        const tempMessage = await symEncrypt(symKey, destination + encryptedMessage);
        destination = String(BASE_ONION_ROUTER_PORT + node.nodeId).padStart(10, '0');
        const encryptedSymKey = await rsaEncrypt(symKeyString, node.pubKey);
        encryptedMessage = encryptedSymKey + tempMessage;
    }
    circuit.reverse()
    lastCircuit = circuit;
    const entryNode = circuit[0];
    if(encryptedMessage!=null) {
        await axios.post(`http://localhost:${BASE_ONION_ROUTER_PORT + entryNode.nodeId}/message`, {
            message: encryptedMessage,
        });
        lastSentMessage = message;
        res.status(200).send('Message sent');
    }
  });
  
  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
