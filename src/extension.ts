import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const IGNORE_LIST = ['node_modules', '.git', 'folder-structure'];

export function activate(context: vscode.ExtensionContext) {

    // Command 1: Generate a tree.txt file from a folder
    const generateTreeFile = vscode.commands.registerCommand('tree-and-folders.generateTreeFile', (uri: vscode.Uri) => {
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
        vscode.window.showInformationMessage(`Tree structure saved to: ${outputPath}`);
    });

    // Command 2: Copy the generated tree to the clipboard
    const copyTreeToClipboard = vscode.commands.registerCommand('tree-and-folders.copyTreeToClipboard', (uri: vscode.Uri) => {
        const startPath = uri.fsPath;
        const treeString = generateTree(startPath);
        vscode.env.clipboard.writeText(treeString);
        vscode.window.showInformationMessage('Tree structure copied to clipboard!');
    });

    // Command 3: Create a folder structure from a tree file
    const createStructureFromFile = vscode.commands.registerCommand('tree-and-folders.createStructureFromFile', (uri: vscode.Uri) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Cannot create structure: No workspace folder open.');
            return;
        }
        const basePath = workspaceFolders[0].uri.fsPath;
        const fileContent = fs.readFileSync(uri.fsPath, 'utf-8');
        
        try {
            createStructureFromText(basePath, fileContent);
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
    // The walk function is what recursively builds the tree
    function walk(dir: string, prefix: string): string {
        let files = fs.readdirSync(dir);
        // Sort to have directories first
        files = files.sort((a, b) => {
            const statA = fs.statSync(path.join(dir, a)).isDirectory();
            const statB = fs.statSync(path.join(dir, b)).isDirectory();
            return (statA === statB) ? a.localeCompare(b) : (statA ? -1 : 1);
        });

        let tree = '';
        files.forEach((file, index) => {
            if (IGNORE_LIST.includes(file)) return;

            const filePath = path.join(dir, file);
            const isLast = index === files.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const stat = fs.statSync(filePath);

            tree += `${prefix}${connector}${file}\n`;
            if (stat.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                tree += walk(filePath, newPrefix);
            }
        });
        return tree;
    }
    return `${dirName}\n${walk(startPath, '')}`;
}

// Parses text and creates the files/folders
function createStructureFromText(basePath: string, text: string) {
    const lines = text.trim().split('\n');
    const pathStack: string[] = [];
    const rootDir = lines.shift()?.trim() || 'new-structure'; // Use first line as root folder
    
    pathStack.push(rootDir);
    const rootPath = path.join(basePath, rootDir);
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath);
    }
    
    lines.forEach(line => {
        const level = (line.match(/│| /g)?.length || 0) / 4;
        const name = line.replace(/[│├└─\s]/g, '');

        if (!name) return;

        pathStack.length = level + 1;
        pathStack.push(name);
        
        const fullPath = path.join(basePath, ...pathStack);

        if (fs.existsSync(fullPath)) return;

        // If the path represents a directory (heuristic: no extension or explicitly marked)
        if (!path.extname(name)) {
            fs.mkdirSync(fullPath, { recursive: true });
        } else {
            // Ensure parent directory exists before creating a file
            const dirName = path.dirname(fullPath);
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }
            fs.writeFileSync(fullPath, '');
        }
    });
}

export function deactivate() {}