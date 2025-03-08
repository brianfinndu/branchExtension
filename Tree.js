// TO DO: transition to a Map object (guarantees iteration in insertion order)

import { TreeNode } from "./TreeNode.js";

export class Tree {
  // nodes: an array of nodes, accessible by id
  // nodeMap: an object of int-as-a-string:set(int-as-a-string) forming the tree
  // freedIds: ids released by node deletion
  constructor(id, nodeMap, nodes) {
    this.id = id;
    this.freedIds = [];
    if (Object.keys(obj).length === 0) {
      this.nodeMap = { 0: new Set() };
    } else {
      this.nodeMap = nodeMap;
    }
    if (nodes.length === 0) {
      this.nodes = [new TreeNode(0, -1, "Root", new Date(), "Root", "")];
    } else {
      this.nodes = nodes;
    }
  }

  getUniqueId() {
    if (this.freedIds.length > 0) {
      return this.freedIds.pop();
    } else {
      return this.nodes.length + 1;
    }
  }

  addNode(newNode) {
    this.nodes[newNode.id] = newNode;
    this.nodeMap[str(newNode.id)] = set();
    this.nodeMap[str(newNode.parentId)].add(str(newNode.id));
  }

  // TO-DO: check if nodeId is in freedIds (invalid)

  deleteNode(nodeId) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }

    let temp = nodes[nodeId];
    this.nodes[nodeId] = new TreeNode(-1, -1, "", new Date(), "", "");
    this.freedIds.append(nodeId);
    this.nodeMap[str(temp.parentId)].delete(str(nodeId));
    this.nodeMap[str(nodeId)].foreach((id) =>
      nodeMap[str(temp.parentId)].add(str(id))
    );
    delete nodeMap[str(nodeId)];
  }

  // TO-DO: move node position within same parent

  moveNode(nodeId, newParentId) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }
    if (newParentId < 0 || newParentId >= this.nodes.length) {
      console.log("Invalid Parent Id.");
      return;
    }
    let temp = nodes[nodeId];
    this.nodeMap[str(temp.parentId)].delete(str(nodeId));
    nodeMap[str(newParentId)].add(str(nodeId));
  }

  getNode(nodeId) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return null;
    }
    return nodes[nodeId];
  }

  editNode(nodeId, newNode) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }
    nodes[nodeId] = newNode;
  }
}
