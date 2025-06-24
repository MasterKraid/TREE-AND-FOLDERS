import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const IGNORE_LIST = ['node_modules', '.git', 'folder-structure', 'out', '.vscode'];
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB limit

export function activate(context: vscode.ExtensionContext) {
    
    // Command 1: Generate a tree.txt file from a folder
    const generateTreeFile = vscode.commands.registerCommand('tree-and-folders.generateTreeFile', (uri: vscode.Uri) => {
        if (!uri) {return;}
        const startPath = uri.fsPath;
        const treeString = generateTree(startPath);
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open to create the structure in.');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        const outputDir = path.join(rootPath, 'folder-structure');
        const outputPath = path.join(outputDir, 'tree.txt');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
        fs.writeFileSync(outputPath, treeString);
        vscode.window.showInformationMessage(`Tree structure saved to: folder-structure/tree.txt`);
    });

    // Command 2: Copy the generated tree to the clipboard
    const copyTreeToClipboard = vscode.commands.registerCommand('tree-and-folders.copyTreeToClipboard', (uri: vscode.Uri) => {
        if (!uri) return;
        const startPath = uri.fsPath;
        const treeString = generateTree(startPath);
        vscode.env.clipboard.writeText(treeString);
        vscode.window.showInformationMessage('Tree structure copied to clipboard!');
    });

    // Command 3: Create a folder structure from a tree file
    const createStructureFromFile = vscode.commands.registerCommand('tree-and-folders.createStructureFromFile', async (uri: vscode.Uri) => {
        if (!uri) return;
        const basePath = path.dirname(uri.fsPath);
        const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');
        try {
            await createStructureFromText(basePath, fileContent);
            vscode.window.showInformationMessage('Structure created successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create structure: ${error.message}`);
        }
    });

    // Command 4: Extract project to a single Markdown file
    const extractToMarkdown = vscode.commands.registerCommand('tree-and-folders.extractToMarkdown', (uri: vscode.Uri) => {
        if (!uri) return;
        const startPath = uri.fsPath;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open to create the markdown file in.');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        try {
            const markdownContent = generateMarkdownContent(startPath);
            const outputDir = path.join(rootPath, 'folder-structure');
            const outputPath = path.join(outputDir, 'project.md');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
            fs.writeFileSync(outputPath, markdownContent);
            vscode.window.showInformationMessage(`Project extracted to: folder-structure/project.md`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to extract project: ${error.message}`);
        }
    });

    // Command 5: Rebuild project from a project.md file
    const rebuildFromMarkdown = vscode.commands.registerCommand('tree-and-folders.rebuildFromMarkdown', async (uri: vscode.Uri) => {
        if (!uri) return;
        const basePath = path.dirname(uri.fsPath);
        const markdownContent = fs.readFileSync(uri.fsPath, 'utf-8');
        try {
            await rebuildProjectFromMarkdown(basePath, markdownContent);
            vscode.window.showInformationMessage('Project rebuilt successfully from project.md!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to rebuild project: ${error.message}`);
        }
    });

    context.subscriptions.push(
        generateTreeFile,
        copyTreeToClipboard,
        createStructureFromFile,
        extractToMarkdown,
        rebuildFromMarkdown
    );
}

function generateTree(startPath: string): string {
    const dirName = path.basename(startPath);
    function walk(dir: string, prefix: string): string {
        let tree = '';
        try {
            const files = fs.readdirSync(dir).filter(file => !IGNORE_LIST.includes(file));
            files.forEach((file, index) => {
                const filePath = path.join(dir, file);
                const isLast = index === files.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    tree += `${prefix}${connector}${file}/\n`;
                    const newPrefix = prefix + (isLast ? '    ' : '│   ');
                    tree += walk(filePath, newPrefix);
                } else {
                    tree += `${prefix}${connector}${file}\n`;
                }
            });
        } catch (error) {}
        return tree;
    }
    return `${dirName}/\n${walk(startPath, '')}`;
}

function createStructureFromText(basePath: string, text: string) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return;

    const rootDirName = lines.shift()!.replace(/[/\\|]/g, '').trim();
    if (!rootDirName) return;

    const pathStack = [rootDirName];
    const rootPath = path.join(basePath, rootDirName);
    if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath);

    lines.forEach(line => {
        const verticalBarMatches = line.match(/│/g);
        const level = (verticalBarMatches ? verticalBarMatches.length : 0) + 1;

        let name = line.replace(/[│├└─\s]/g, '').trim();
        if (!name) return;

        const isDirectory = name.endsWith('/');
        if (isDirectory) name = name.slice(0, -1);
        
        pathStack.length = level;
        pathStack.push(name);
        
        const fullPath = path.join(basePath, ...pathStack);

        if (isDirectory) {
            if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
        } else {
            const dirName = path.dirname(fullPath);
            if (!fs.existsSync(dirName)) fs.mkdirSync(dirName, { recursive: true });
            if (!fs.existsSync(fullPath)) fs.writeFileSync(fullPath, '');
        }
    });
}

function generateMarkdownContent(startPath: string): string {
    const rootName = path.basename(startPath);
    let markdown = "## Folder Structure\n\n";
    markdown += "```\n" + generateTree(startPath) + "```\n\n";
    markdown += "## Code\n\n";
    function walkAndRead(dir: string) {
        try {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (IGNORE_LIST.includes(file)) return;
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    walkAndRead(filePath);
                } else if (stat.isFile() && stat.size < MAX_FILE_SIZE_BYTES) {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const relativePath = path.relative(startPath, filePath);
                    const language = path.extname(file).substring(1);
                    const logicalPath = path.join(rootName, relativePath).replace(/\\/g, '/');
                    markdown += `### \`${logicalPath}\`\n\n`;
                    markdown += `\`\`\`${language}\n`;
                    markdown += content;
                    markdown += "\n\`\`\`\n\n";
                }
            });
        } catch (error) {}
    }
    walkAndRead(startPath);
    return markdown;
}

// Function: Rebuild a project from a markdown file
function rebuildProjectFromMarkdown(basePath: string, markdownContent: string) {
    // Step 1: Extract the folder structure tree
    const treeRegex = /## Folder Structure\s*```([\s\S]*?)```/;
    const treeMatch = markdownContent.match(treeRegex);
    if (!treeMatch || !treeMatch[1]) {
        throw new Error('Could not find the folder structure block in the markdown file.');
    }
    const treeText = treeMatch[1].trim();

    // Step 2: Create the folder and empty file skeleton
    createStructureFromText(basePath, treeText);

    // Step 3: Extract and write the content for each file
    const codeBlockRegex = /### `(.+?)`\s*```[^\n]*\n([\s\S]*?)\n```/g;
    let match;
    while ((match = codeBlockRegex.exec(markdownContent)) !== null) {
        const relativePath = match[1];
        const codeContent = match[2];
        const fullPath = path.join(basePath, relativePath);

        // This check is important. It prevents trying to write to a directory.
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            continue;
        }

        const dirName = path.dirname(fullPath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }
        fs.writeFileSync(fullPath, codeContent);
    }
}

export function deactivate() {}