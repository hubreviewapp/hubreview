function convertHtmlToMarkdown(html) {
  // Function to recursively traverse the DOM tree and generate Markdown
  const traverse = (node) => {
    let markdown = "";

    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(traverse).join("");

      switch (tagName) {
        case "p":
          markdown += children + "\n\n";
          break;
        case "a":
          markdown += `[${children}](${node.getAttribute("href")})`;
          break;
        case "strong":
          markdown += `**${children}**`;
          break;
        case "em":
          markdown += `*${children}*`;
          break;
        case "h1":
          markdown += `# ${children}\n\n`;
          break;
        case "h2":
          markdown += `## ${children}\n\n`;
          break;
        case "h3":
          markdown += `### ${children}\n\n`;
          break;
        // Add cases for other HTML elements you want to handle
        default:
          markdown += children;
          break;
      }
    }

    return markdown;
  };

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return traverse(wrapper);
}

export default convertHtmlToMarkdown;
