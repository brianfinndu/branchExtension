class Tree {
  // nodes: an array of nodes, accessible by id
  // nodeMap: an object of int:set(int) forming the tree

  // for use when a tree is first made
  constructor() {
    this.id = 0;
    this.nodeMap = {};
    this.nodes = [];
  }

  // for use when a tree is recreated
  constructor(id, nodeMap, nodes) {
    this.id = id;
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
    };

    let temp = nodes[nodeId];
    this.nodes[nodeId] = null;
    this.nodeMap[temp.parentId].delete(nodeId);
    this.nodes[nodeId].children.foreach((id) => 
      nodeMap[temp.parentId].add(id));
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
