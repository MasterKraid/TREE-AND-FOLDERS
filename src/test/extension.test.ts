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

// Parses text and creates the files/folders
function createStructureFromText(basePath: string, text: string) {
    const lines = text.trim().split('\n');
    const pathStack: string[] = [];
    
    lines.forEach(line => {
        // This regex is more robust for calculating indentation level
        const indentationMatch = line.match(/^([│\s]*)/);
        const level = indentationMatch ? indentationMatch[0].length / 4 : 0;
        
        // Clean the line to get just the file or folder name
        let name = line.replace(/[│├└─\s]/g, '').trim();
        if (!name) return;

        // The reliable way to check for a directory is the trailing slash
        const isDirectory = name.endsWith('/');
        if (isDirectory) {
            name = name.slice(0, -1);
        }

        // Adjust the path stack based on the current item's level
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
                fs.writeFileSync(fullPath, ''); // Create empty file
            }
        }
    });
}

export function deactivate() {}