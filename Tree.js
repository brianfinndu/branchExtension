import { TreeNode } from "./TreeNode.js";
import { generateUUID, nilUUID } from "./uuid.js";

export class Tree {
  // id: UUID which must be unique among the user's trees
  // nodeMap: UUID mapped to list of UUIDs
  // nodes: UUID mapped to TreeNode objects
  // name: user-facing name

  // note that the root id will always be "00000000-0000-0000-0000-000000000000"

  constructor(id, nodeMap, nodes, name = "default tree") {
    this.id = id;

    if (Object.keys(nodeMap).length === 0) {
      this.nodeMap = { "00000000-0000-0000-0000-000000000000": [] };
    } else {
      this.nodeMap = nodeMap;
    }

    if (nodes.length === 0) {
      this.nodes = {
        "00000000-0000-0000-0000-000000000000": new TreeNode(
          nilUUID(),
          "invalid",
          "Root",
          new Date().toISOString(),
          "Root",
          ""
        ),
      };
    } else {
      this.nodes = nodes;
    }
    this.name = name;
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
    let uniqueCandidate = generateUUID();
    while (uniqueCandidate in this.nodes) {
      uniqueCandidate = generateUUID();
    }
    return uniqueCandidate;
  }

  addNode(newNode) {
    this.nodes[newNode.id] = newNode;
    this.nodeMap[newNode.id] = [];
    this.nodeMap[newNode.parentId].push(newNode.id);
  }

  deleteNode(nodeId) {
    if (nodeId === nilUUID()) {
      console.log("Cannot delete root.");
      return;
    }
    let temp = this.nodes[nodeId];
    delete this.nodes[nodeId];

    // remove node from its parent's children list
    const index = this.nodeMap[temp.parentId].indexOf(nodeId);
    this.nodeMap[temp.parentId].splice(index, 1);

    // add its children to the parent's nodeMap
    // reassign its children's parentID
    for (const childId of this.nodeMap[temp.id]) {
      this.nodeMap[temp.parentId].push(childId);
      this.nodes[childId].parentId = temp.parentId;
    }

    // delete its nodeMap entry
    delete this.nodeMap[nodeId];
  }

  // delete your children, then delete yourself
  deleteTree(nodeId) {
    if (nodeId === nilUUID()) {
      console.log("Cannot delete root.");
      return;
    }
    let temp = this.nodes[nodeId];
    const index = this.nodeMap[temp.parentId].indexOf(nodeId);
    this.nodeMap[temp.parentId].splice(index, 1);

    this.deleteTreeHelper(nodeId);
  }

  deleteTreeHelper(nodeId) {
    for (const childId of this.nodeMap[nodeId]) {
      this.deleteTreeHelper(childId);
    }

    delete this.nodes[nodeId];
    delete this.nodeMap[nodeId];
  }

  // TO-DO: move single node

  moveNode(nodeId, newParentId) {
    if (nodeId === nilUUID()) {
      console.log("Cannot move root.");
      return;
    }

    let temp = this.nodes[nodeId];

    // remove node from its parent's children list
    const index = this.nodeMap[temp.parentId].indexOf(nodeId);
    this.nodeMap[temp.parentId].splice(index, 1);

    // add its children to the parent's nodeMap
    // reassign its children's parentID
    for (const childId of this.nodeMap[temp.id]) {
      this.nodeMap[temp.parentId].push(childId);
      this.nodes[childId].parentId = temp.parentId;
    }

    // add the node to the desired parent's children list
    this.nodeMap[newParentId].push(nodeId);

    // change the node's internal parent ID value
    this.nodes[nodeId].parentId = newParentId;

    // empty the moved node's children list (they were left behind)
    this.nodeMap[nodeId] = [];
  }

  moveTree(rootId, newParentId) {
    if (rootId === nilUUID()) {
      console.log("Cannot move root.");
      return;
    }
    if (rootId === newParentId) {
      console.log("Target parent is the same as moving node.");
      return;
    }
    if (this.isDescendant(newParentId, rootId)) {
      console.log("Target parent is in moving node's subtree.");
      return;
    }

    let temp = this.nodes[rootId];
    // remove node from its former parent's nodeMap
    const index = this.nodeMap[temp.parentId].indexOf(rootId);
    this.nodeMap[temp.parentId].splice(index, 1);

    // add node to its new parent's nodeMap
    this.nodeMap[newParentId].push(rootId);

    // change node's parentId
    temp.parentId = newParentId;
  }

  getNode(nodeId) {
    if (!(nodeId in this.nodes)) {
      console.log("Node not found. Get node failed.");
      return null;
    }

    return this.nodes[nodeId];
  }

  editNode(nodeId, field, newValue) {
    if (!(nodeId in this.nodes)) {
      console.log("Node not found. Edit failed.");
      return;
    }
    this.nodes[nodeId][field] = newValue;
  }
}
