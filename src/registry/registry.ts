import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

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

  // Initialize variables to store registered nodes
  let reg_nodes: Node[] = [];


  // implement the status route
  _registry.get("/status", (req, res) => {
    res.send("live");
  });

  //You should create an HTTP POST route called /registerNode which allows for nodes to register themselves on the registry.
  _registry.post("/registerNode", (req: Request<{}, {}, RegisterNodeBody>, res: Response) => {
    const new_Node: Node = { nodeId: req.body.nodeId, pubKey: req.body.pubKey, privKey: req.body.privKey};
    reg_nodes.push(new_Node);
    res.status(200).json({ message: "Node registered successfully." });
  });

  //Create an HTTP GET route called /getPrivateKey that allows the unit tests to retrieve the private key of a node.
  //requests are of the type getPrivateKey(BASE_ONION_ROUTER_PORT + node.nodeId);
  _registry.get("/getPrivateKey", (req, res) => {
    const nodeId = parseInt(req.query.nodeId as string);
    const node = reg_nodes.find((node) => node.nodeId === nodeId);
    if (node) {
      res.json({ privKey: node.privKey });
    } else {
      res.status(404).json({ error: "Node not found" });
    }
  });

  //Create an HTTP GET route called /getNodeRegistry that allows the unit tests to retrieve the list of registered nodes.
  _registry.get("/getNodeRegistry", (req, res) => {
    res.json({ nodes: reg_nodes });
  });

  
  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
