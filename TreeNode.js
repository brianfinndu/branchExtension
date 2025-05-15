export class TreeNode {
  constructor(
    id,
    parentId,
    url,
    timestamp,
    title,
    favicon,
    contentType = "link",
    visited = true,
    expanded = true
  ) {
    this.id = id;
    this.parentId = parentId;
    this.url = url;
    // this is to set the timestamp to be in readable time not UTC set by your computer timezone dynamically
    this.timestamp = new Date(timestamp).toLocaleString();
    this.title = title;
    this.favicon = favicon;
    this.contentType = contentType;
    this.visited = visited;
    this.expanded = expanded;
  }
}
