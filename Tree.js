// TO-DO: only use serializable data structures when writing to persistent storage

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

  getUniqueId() {
    if (this.freedIds.length > 0) {
      return this.freedIds.pop();
    } else {
      return this.nodes.length;
    }
  }

  addNode(newNode) {
    console.log(newNode);
    this.nodes[newNode.id] = newNode;
    this.nodeMap[newNode.id.toString()] = [];
    this.nodeMap[newNode.parentId.toString()].push(newNode.id.toString());
  }

  // TO-DO: check if nodeId is in freedIds (invalid)

  deleteNode(nodeId) {
    if (nodeId <= 0 || nodeId >= this.nodes.length) {
      console.log("Invalid Id.");
      return;
    }
    let temp = nodes[nodeId];
    this.nodes[nodeId] = new TreeNode(
      -1,
      -1,
      "",
      new Date().toISOString(),
      "",
      ""
    );
    this.freedIds.append(nodeId);

    // remove node from its parent's nodeMap
    const index = this.nodeMap[temp.parentId.toString()].indexOf(
      nodeId.toString()
    );
    this.nodeMap[temp.parentId.toString()].splice(index, 1);

    // add its children to the parent's nodeMap
    this.nodeMap[nodeId.toString()].foreach((id) =>
      nodeMap[temp.parentId.toString()].push(id.toString())
    );

    // delete its nodeMap entry
    delete nodeMap[nodeId.toString()];
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

    // remove node from its former parent's nodeMap
    const index = this.nodeMap[temp.parentId.toString()].indexOf(
      nodeId.toString()
    );
    this.nodeMap[temp.parentId.toString()].splice(index, 1);

    // add node to its new parent's nodeMap
    nodeMap[newParentId.toString()].push(nodeId.toString());
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
    this.nodes[nodeId] = newNode;
  }

  toJSON() {
    const treeData = {
      id: this.id,
      nodeMap: Object.fromEntries(
        Object.entries(this.nodeMap).map(([key, value]) => [key, [...value]])
      ),
      nodes: this.nodes.map(node =>
        node
          ? {
              parentId: node.parentId,
              url: node.url,
              timestamp: node.timestamp,
              title: node.title,
              favicon: node.favicon
            }
          : null
      )
    };
    return JSON.stringify(treeData, null, 2);
  }
}
