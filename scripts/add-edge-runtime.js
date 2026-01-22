const fs = require('fs');
const path = require('path');

function addEdgeRuntimeToFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has runtime export
    if (content.includes("export const runtime = 'edge'")) {
      return false;
    }
    
    // For client components
    if (content.startsWith('"use client"')) {
      content = content.replace(
        /("use client"\s*\n)/,
        '$1\nexport const runtime = \'edge\';\n'
      );
    } 
    // For server components or API routes
    else {
      // Find the first import or export statement
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Skip comments and blank lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, "export const runtime = 'edge';");
      content = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += processDirectory(filePath);
    } else if (file === 'page.tsx' || file === 'route.ts' || file === 'layout.tsx') {
      if (addEdgeRuntimeToFile(filePath)) {
        console.log(`Added edge runtime to: ${filePath}`);
        count++;
      }
    }
  }
  
  return count;
}

const appDir = path.join(__dirname, '..', 'app');
console.log(`Processing directory: ${appDir}`);
const total = processDirectory(appDir);
console.log(`\nTotal files updated: ${total}`);
