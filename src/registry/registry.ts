import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

// Initialize variables to store registered nodes
const nodes = [] as Node[];

export type Node = { nodeId: number; pubKey: string; privKey: string};

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
  privKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // implement the status route
  _registry.get("/status", (req, res) => {
    res.send("live");
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });
  //You should create an HTTP POST route called /registerNode which allows for nodes to register themselves on the registry.

  _registry.post("/registerNode", (req: Request<{}, {}, RegisterNodeBody>, res: Response<GetNodeRegistryBody>) => {
    const { nodeId, pubKey, privKey } = req.body;
    nodes.push({ nodeId, pubKey, privKey });
    res.json({ nodes });
  }
  );

  //Create an HTTP GET route called /getPrivateKey that allows the unit tests to retrieve the private key of a node.
  _registry.get("/getPrivateKey", (req, res) => {
    res.json({ result: nodes[0].privKey });
  });

  //Create an HTTP GET route called /getNodeRegistry that allows the unit tests to retrieve the list of registered nodes.
  _registry.get("/getNodeRegistry", (req, res) => {
    res.json({ nodes });
  });
  
  return server;
}
