// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Content script loaded');

  // Select the comment tree table by class
  const commentTree = document.querySelector('table.comment-tree');
  
  if (!commentTree) {
    console.error('Comment tree not found');
    return;
  }

  // Get the tbody element
  const tbody = commentTree.querySelector('tbody');

  if (!tbody) {
    console.error('Tbody element not found');
    return;
  }

  // Select only the top-level rows in the tbody
  const commentRows = Array.from(tbody.children).filter(child => child.tagName === 'TR');

  // Function to get the comment ID from a row
  const getCommentId = (row) => {
    return parseInt(row.id, 10);
  };

  // Sort the rows based on their IDs
  commentRows.sort((a, b) => {
    return getCommentId(a) - getCommentId(b);
  });

  // Append the sorted rows back to the tbody
  commentRows.forEach(row => {
    tbody.appendChild(row);
  });

  // Map to store comment IDs and their corresponding rows
  const commentMap = {};
  commentRows.forEach(row => {
    commentMap[row.id] = row;
  });

  // Create a function to clear highlights
  const clearHighlights = () => {
    commentRows.forEach(row => {
      row.style.backgroundColor = ''; // Remove background color
    });
  };

  // Function to handle link clicks and highlight comments
  const handleLinkClick = (event) => {
    event.preventDefault(); // Prevent the default action

    // Clear previous highlights
    clearHighlights();

    // Get the target ID from the clicked link's href
    const targetId = event.target.getAttribute('href').match(/#(\d+)/)[1];
    const targetRow = commentMap[targetId];

    if (targetRow) {
      // Highlight the selected comment
      targetRow.style.backgroundColor = 'tan';

      // Scroll to the target element
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Process each row to move parent link as the first child of the comment div
  commentRows.forEach(row => {
    // Find the navs span directly within the row
    const navsSpan = row.querySelector('span.navs');
    if (navsSpan) {
      // Find the single parent link within navsSpan
      const parentLink = Array.from(navsSpan.querySelectorAll('a')).find(link => {
        const href = link.getAttribute('href');
        const parentIdMatch = href.match(/#(\d+)/);
        return parentIdMatch && link.textContent.trim().toLowerCase() === 'parent';
      });
      if (parentLink) {
        // Extract the numeric ID from the href attribute
        const href = parentLink.getAttribute('href');
        const parentIdMatch = href.match(/#(\d+)/);
        if (parentIdMatch) {
          const parentId = parentIdMatch[1];

          // Create a new link element for the parent ID
          const newParentLink = document.createElement('a');
          newParentLink.setAttribute('href', href);
          newParentLink.textContent = `Parent ID: ${parentId}`;
          
          // Add click event listener to the new parent link
          newParentLink.addEventListener('click', handleLinkClick);

          // Create a container span for the parent link
          const parentLinksSpan = document.createElement('span');
          parentLinksSpan.appendChild(newParentLink);

          const commentDiv = row.querySelector('div.comment');
          if (commentDiv) {
            commentDiv.insertBefore(parentLinksSpan, commentDiv.firstChild);
          } else {
            console.warn('Comment div not found for row ID:', row.id);
          }
        }
      } else {
        console.warn('Parent link not found in row ID:', row.id);
      }
    } else {
      console.warn('Navs span not found in row ID:', row.id);
    }

    // Handle indentation
    const indentTds = row.querySelectorAll('td');
    indentTds.forEach(td => {
      const img = td.querySelector('img[src="s.gif"]');
      if (img) {
        // Set the width of the image to 0
        img.style.width = '0';
      }
    });
  });

  // Process each row to add links to direct replies only
  commentRows.forEach(row => {
    const rowId = row.id;
    const commentDiv = row.querySelector('div.comment');

    if (commentDiv) {
      // Create a container span for reply links
      const replyLinksSpan = document.createElement('span');

      commentRows.forEach(replyRow => {
        // Check if the current replyRow has a direct reply to the current rowId
        const navsSpan = replyRow.querySelector('span.navs');
        if (navsSpan) {
          const replyLink = Array.from(navsSpan.querySelectorAll('a')).find(link => {
            const href = link.getAttribute('href');
            const replyIdMatch = href.match(/#(\d+)/);
            return replyIdMatch && replyIdMatch[1] === rowId && link.textContent.trim().toLowerCase() === 'parent';
          });
          
          if (replyLink) {
            // Create a new link element for the reply ID
            const newReplyLink = document.createElement('a');
            newReplyLink.setAttribute('href', `#${replyRow.id}`);
            newReplyLink.textContent = `Reply ID: ${replyRow.id}`;

            // Add click event listener to the new reply link
            newReplyLink.addEventListener('click', handleLinkClick);

            // Append the new link to the replyLinksSpan
            replyLinksSpan.appendChild(newReplyLink);

            // Add a pipe and space between links
            replyLinksSpan.appendChild(document.createTextNode(' | '));
          }
        }
      });

      // Remove the trailing pipe and space
      if (replyLinksSpan.lastChild && replyLinksSpan.lastChild.nodeType === Node.TEXT_NODE) {
        replyLinksSpan.lastChild.remove();
      }

      if (replyLinksSpan.childNodes.length > 0) {
        commentDiv.appendChild(replyLinksSpan);
      }
    } else {
      console.warn('Comment div not found for row ID:', row.id);
    }
  });

  console.log('Comments sorted, parent links updated with IDs, direct reply links added, indentation adjusted, and highlights managed.');
});
