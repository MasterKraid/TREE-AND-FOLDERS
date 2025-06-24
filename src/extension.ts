import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Add more folders to ignore during tree generation
const IGNORE_LIST = ['node_modules', '.git', 'folder-structure', 'out', '.vscode'];

export function activate(context: vscode.ExtensionContext) {

    // Command 1: Generate a tree.txt file from a folder
    const generateTreeFile = vscode.commands.registerCommand('tree-and-folders.generateTreeFile', (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('Please right-click a folder in the explorer to use this command.');
            return;
        }
        const startPath = uri.fsPath;
        const treeString = generateTree(startPath);

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        const outputDir = path.join(rootPath, 'folder-structure');
        const outputPath = path.join(outputDir, 'tree.txt');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        fs.writeFileSync(outputPath, treeString);
        vscode.window.showInformationMessage(`Tree structure saved to: folder-structure/tree.txt`);
    });

    // Command 2: Copy the generated tree to the clipboard
    const copyTreeToClipboard = vscode.commands.registerCommand('tree-and-folders.copyTreeToClipboard', (uri: vscode.Uri) => {
        if (!uri) {
            vscode.window.showErrorMessage('Please right-click a folder in the explorer to use this command.');
            return;
        }
        const startPath = uri.fsPath;
        const treeString = generateTree(startPath);
        vscode.env.clipboard.writeText(treeString);
        vscode.window.showInformationMessage('Tree structure copied to clipboard!');
    });

    // Command 3: Create a folder structure from a tree file
    const createStructureFromFile = vscode.commands.registerCommand('tree-and-folders.createStructureFromFile', async (uri: vscode.Uri) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Cannot create structure: No workspace folder open.');
            return;
        }
        // Create the structure in the same directory as the tree.txt file
        const basePath = path.dirname(uri.fsPath);
        const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');
        
        try {
            await createStructureFromText(basePath, fileContent);
            vscode.window.showInformationMessage('Structure created successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create structure: ${error.message}`);
        }
    });

    context.subscriptions.push(generateTreeFile, copyTreeToClipboard, createStructureFromFile);
}

// Generates the text tree string starting from a given path
function generateTree(startPath: string): string {
    const dirName = path.basename(startPath);
    function walk(dir: string, prefix: string): string {
        const files = fs.readdirSync(dir);
        let tree = '';
        files.forEach((file, index) => {
            if (IGNORE_LIST.includes(file)) return;

            const filePath = path.join(dir, file);
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Add a trailing slash for directories for clarity and better parsing
                tree += `${prefix}${connector}${file}/\n`;
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                tree += walk(filePath, newPrefix);
            } else {
                tree += `${prefix}${connector}${file}\n`;
            }
        });
        return tree;
    }
    // Start with the root directory name, followed by a newline
    return `${dirName}/\n${walk(startPath, '')}`;
}

// ====================================================================
// THIS IS THE CORRECTED FUNCTION
// ====================================================================
function createStructureFromText(basePath: string, text: string) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return;

    // The first line is the root directory of the new structure
    const rootDirName = lines.shift()!.replace('/', '').trim();
    if (!rootDirName) return;

    // The pathStack will keep track of the current directory hierarchy
    const pathStack = [rootDirName];
    const rootPath = path.join(basePath, rootDirName);
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath);
    }

    lines.forEach(line => {
        // This is a more robust way to find the indentation level.
        // It finds the index of the first actual character of the name.
        const level = line.search(/[^│\s├─└]/) / 4;

        let name = line.replace(/[│├└─\s]/g, '').trim();
        if (!name) return;

        const isDirectory = name.endsWith('/');
        if (isDirectory) {
            name = name.slice(0, -1);
        }

        // Adjust the path stack to the correct level for the new item
        pathStack.length = level;
        pathStack.push(name);
        
        const fullPath = path.join(basePath, ...pathStack);

        if (isDirectory) {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }
        } else {
            // Ensure parent directory exists before creating a file
            const dirName = path.dirname(fullPath);
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }
            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, '');
            }
        }
    });
}

export function deactivate() {}