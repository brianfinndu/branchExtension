// TO-DO: implement a more robust and modular id checker

import { TreeNode } from "./TreeNode.js";

export class Tree {
  // nodes: an array of nodes, accessible by id
  // nodeMap: an object of int-as-a-string:[int-as-a-string] forming the tree
  // freedIds: ids released by node deletion
  constructor(id, nodeMap, nodes) {
    this.id = id;
    this.freedIds = [];
    if (Object.keys(nodeMap).length === 0) {
      this.nodeMap = { 0: [] };
    } else {
      this.nodeMap = nodeMap;
    }
    if (nodes.length === 0) {
      this.nodes = [
        new TreeNode(0, -1, "Root", new Date().toISOString(), "Root", ""),
      ];
    } else {
      this.nodes = nodes;
    }
  }

  // new parent, moving node
  isDescendant(testId, rootId) {
    if (this.nodeMap[rootId].length == 0) {
      return false;
    }
    if (this.nodeMap[rootId].includes(testId)) {
      return true;
    }

    for (const id of this.nodeMap[rootId]) {
      if (this.isDescendant(testId, id)) {
        return true;
      }
    }

    return false;
  }

  getUniqueId() {
    if (this.freedIds.length > 0) {
      return this.freedIds.pop();
    } else {
      return this.nodes.length;
    }
  }

  addNode(newNode) {
    if (newNode.id < 0 || newNode.parentId < 0) {
      console.log("Invalid node ID or parent ID");
      return;
    }

    this.nodes[newNode.id] = newNode;
    this.nodeMap[newNode.id.toString()] = [];
    this.nodeMap[newNode.parentId.toString()].push(newNode.id.toString());
  }

  deleteNode(nodeId) {
    if (
        nodeId <= 0 ||
        nodeId >= this.nodes.length ||
        this.freedIds.includes(nodeId)
    ) {
      console.log("Invalid Id.");
      return;
    }
    let temp = this.nodes[nodeId];
    this.nodes[nodeId] = new TreeNode(
        -1,
        -1,
        "",
        new Date().toISOString(),
        "",
        ""
    );
    this.freedIds.push(nodeId);

    // remove node from its parent's nodeMap
    const index = this.nodeMap[temp.parentId.toString()].indexOf(
        nodeId.toString()
    );
    this.nodeMap[temp.parentId.toString()].splice(index, 1);

    // add its children to the parent's nodeMap
    for (const id of this.nodeMap[temp.id.toString()]) {
      this.nodeMap[temp.parentId.toString()].push(id.toString());
    }

    // delete its nodeMap entry
    delete this.nodeMap[nodeId.toString()];
  }

  // delete your children, then delete yourself
  deleteTree(nodeId) {
    if (
        nodeId <= 0 ||
        nodeId >= this.nodes.length ||
        this.freedIds.includes(nodeId)
    ) {
      console.log("Invalid Id.");
      return;
    }
    let temp = this.nodes[nodeId];
    const index = this.nodeMap[temp.parentId.toString()].indexOf(
        nodeId.toString()
    );
    this.nodeMap[temp.parentId.toString()].splice(index, 1);

    this.deleteTreeHelper(nodeId);
  }

  deleteTreeHelper(nodeId) {
    for (const childId of this.nodeMap[nodeId.toString()]) {
      this.deleteTreeHelper(childId);
    }

    this.nodes[nodeId] = new TreeNode(
        -1,
        -1,
        "",
        new Date().toISOString(),
        "",
        ""
    );

    this.freedIds.push(nodeId);

    delete this.nodeMap[nodeId.toString()];
  }

  // TO-DO: move single node

  // moveNode(nodeId, newParentId) {}

  moveTree(rootId, newParentId) {
    if (parseInt(rootId) <= 0 || parseInt(rootId) >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }
    if (
        parseInt(newParentId) < 0 ||
        parseInt(newParentId) >= this.nodes.length
    ) {
      console.log("Invalid Parent Id.");
      return;
    }
    if (rootId === newParentId) {
      console.log("Target parent is the same as moving node");
      return;
    }
    if (this.isDescendant(newParentId, rootId)) {
      console.log("Target parent is in moving node's subtree");
      return;
    }

    let temp = this.nodes[rootId];
    // remove node from its former parent's nodeMap
    const index = this.nodeMap[temp.parentId.toString()].indexOf(
        rootId.toString()
    );

    this.nodeMap[temp.parentId.toString()].splice(index, 1);

    // add node to its new parent's nodeMap
    this.nodeMap[newParentId.toString()].push(rootId.toString());

    // change node's parentId
    temp.parentId = newParentId;
  }

  getNode(nodeId) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return null;
    }
    return this.nodes[nodeId];
  }

  editNode(nodeId, newNode) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }
    this.nodes[nodeId] = newNode;
  }
}