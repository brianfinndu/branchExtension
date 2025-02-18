class Tree {
  // nodes: an array of nodes, accessible by id
  // nodeMap: an object of int:set(int) forming the tree

  // for use when a tree is first made
  constructor(id = 0, nodeMap = {}, nodes = []) {
    this.id = id;
    this.nodeMap = nodeMap;
    this.nodes = nodes;
    this.maxId = nodes.length; // Track the max node ID
  }

  getMaxId() {
    this.maxId++;
    return this.maxId;
  }

  addNode(newNode) {
    const nodeId = this.getMaxId(); // Assign a unique ID
    newNode.id = nodeId;
    this.nodes.push(newNode);

    if (!this.nodeMap[newNode.parentId]) {
        this.nodeMap[newNode.parentId] = new Set();
    }
    this.nodeMap[newNode.parentId].add(nodeId);
    this.nodeMap[nodeId] = new Set(); // Initialize child set

    return nodeId; // Return the assigned ID
}

  deleteNode(nodeId) {
    if (!this.nodes[nodeId]) {
      console.log("Invalid Id.");
      return;
    }

    let temp = this.nodes[nodeId];
    this.nodes[nodeId] = null;

    if (this.nodeMap[temp.parentId]) {
      this.nodeMap[temp.parentId].delete(nodeId);
    }

    // Reattach children to the deleted node's parent
    this.nodeMap[nodeId]?.forEach((childId) => {
      this.nodeMap[temp.parentId]?.add(childId);
    });

    delete this.nodeMap[nodeId];
  }

  moveNode(nodeId, newParentId) {
    if (!this.nodes[nodeId] || !this.nodes[newParentId]) {
      console.log("Invalid Id or Parent Id.");
      return;
    }

    let temp = this.nodes[nodeId];
    this.nodeMap[temp.parentId]?.delete(nodeId);
    this.nodeMap[newParentId].add(nodeId);
    temp.parentId = newParentId;
  }

  getNode(nodeId) {
    return this.nodes[nodeId] || null;
  }

  editNode(nodeId, newNode) {
    if (!this.nodes[nodeId]) {
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
