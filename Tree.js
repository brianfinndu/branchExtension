// TO DO: restructure nodes array into a deque (doubly linked list)
// currently, deleted nodes remain in memory (wasteful!!)

// TO DO: transition to a Map object (guarantees iteration in insertion order)

// import { TreeNode } from "./TreeNode.js";

class Tree {
  // nodes: an array of nodes, accessible by id
  // nodeMap: an object of int:set(int) forming the tree

  // if initializing a tree for the first time, id is whatever is free, maxId is 0,
  // nodeMap is 0:empty-set, and nodes is [new TreeNode()] with default args
  constructor(id, maxId, nodeMap, nodes) {
    this.id = id;
    this.maxId = maxId;
    this.nodeMap = nodeMap;
    this.nodes = nodes;
  }

  getMaxId() {
    this.maxId++;
    return this.maxId;
  }

  addNode(newNode) {
    this.nodes.append(newNode);
    this.nodeMap[newNode.id] = set();
    this.nodeMap[newNode.parentId].add(newNode.id);
  }

  deleteNode(nodeId) {
    if (nodeId < 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
    }

    let temp = nodes[nodeId];
    this.nodes[nodeId] = null;
    this.nodeMap[temp.parentId].delete(nodeId);
    this.nodes[nodeId].children.foreach((id) => nodeMap[temp.parentId].add(id));
    delete nodeMap[nodeId];
  }

  moveNode(nodeId, newParentId) {
    if (nodeId < 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
    }
    if (newParentId < 0 || newParentId >= this.nodes.length) {
      console.log("Invalid Parent Id.");
    }
    let temp = nodes[nodeId];
    this.nodeMap[temp.parentId].delete(nodeId);
    nodeMap[newParentId].add(nodeId);
  }

  getNode(nodeId) {
    if (nodeId < 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
    }
    return nodes[nodeId];
  }

  editNode(nodeId, newNode) {
    if (nodeId < 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
    }
    nodes[nodeId] = newNode;
  }
}

export { Tree };
