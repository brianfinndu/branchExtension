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
    this.timestamp = new Date(timestamp).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"});
    this.title = title;
    this.favicon = favicon;
    this.contentType = contentType;
    this.visited = visited;
    this.expanded = expanded;
  }
}
