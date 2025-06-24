# Tree and Folders: The Extension for People Who Love Trees (and Folders).

![A banner image for the extension that I still need to make!.](placeholder-for-banner.gif)

Ever found yourself staring at a project structure in a tutorial, a text file, or a GitHub issue and thought, "I wish I didn't have to manually create all those files and folders like some kind of digital peasant?"

Or maybe you've built the most beautifully organized project and wanted to show it off, but taking a screenshot just felt... inadequate.

If you've answered "yes," or even just shrugged indifferently, then **Tree and Folders** is the mildly life-changing extension you never knew you needed. It's the ultimate round-trip ticket for your project's architecture, turning text into tangible directories and back again. It's like Git, but for people who find `git clone` too mainstream.

---

## Features

This extension provides a powerful two-way workflow for managing directory structures.

*   **Export Your Project:** Generate a clean, text-based tree diagram of any folder.
*   **Document Everything:** Create a single, comprehensive `project.md` file containing your entire project's structure and code. Perfect for tutorials, documentation, or for sharing with your favorite AI.
*   **Rebuild from Text:** Magically recreate an entire project structure—including files with content—from a `tree.txt` or `project.md` file.

---

## Commands & How to Use Them

All commands are accessible by **right-clicking a folder or specifically any `tree.txt` or `project.md` file** in the VSCodium/VS Code Explorer.

### 1. The "Show-Off" Commands (Exporting Your Project)

Right-click on any folder (or the empty space in the explorer to target the root) to access these commands.

#### `Generate Tree File`

Creates a `tree.txt` file inside a new `folder-structure` directory. This file contains a clean, text-based visual map of your project.

*(Placeholder for a GIF showing a right-click on a folder and selecting "Generate Tree File", then showing the created tree.txt)*
`![Generate Tree File Demo](placeholder-for-generate-tree.gif)`

#### `Copy Tree to Clipboard`

Does the same thing as `Generate Tree File`, but instead of saving to a file, it copies the tree diagram directly to your clipboard. Peak efficiency.

#### `Extract Project to Markdown`

This is the main event. It generates a `project.md` file in the `folder-structure` directory. This single markdown file contains:
1.  A "Folder Structure Written" section with the full tree diagram.
2.  A "Code" section with the complete contents of every file in your project, neatly wrapped in formatted code blocks.

*(Placeholder for a GIF showing a right-click and selecting "Extract Project to Markdown", then opening the resulting project.md file and scrolling through it)*
`![Extract to Markdown Demo](placeholder-for-extract-md.gif)`

---

### 2. The Rebuilding Commands (Rebuilding from Text)

These commands bring your text and md to code without manual copy paste.

#### `Create Folder Structure from tree.txt`

Right-click on a file named **exactly** `tree.txt`. The extension will read the tree diagram within and create the complete folder structure with empty files. It cleverly skips creating the top-most root folder from the diagram, building the contents directly where your `tree.txt` is located.

*(Placeholder for a GIF showing a right-click on tree.txt and selecting the command, then showing the folders and empty files being created in the explorer)*
`![Create from tree.txt Demo](placeholder-for-create-from-tree.gif)`

#### `Rebuild Project from project.md`

This is where the real magic happens. Right-click a file named **exactly** `project.md`. The extension will:
1.  Read the code blocks and their corresponding file paths from the markdown.
2.  Create all the necessary directories and sub-directories.
3.  Create each file and fill it with its original code content.

It's basically `git clone` for people who prefer to email a single `.md` file.

*(Placeholder for a GIF showing a right-click on project.md and selecting the command, then showing the full project, with content-filled files, being magically created)*
`![Rebuild from project.md Demo](placeholder-for-rebuild-md.gif)`

---

## Why Use This Instead of Git?

Look, we're not trying to replace Git. We love Git. But sometimes you just want to...
*   ...quickly share a project's layout without giving someone repository access.
*   ...paste a complete, self-contained project example into a document or a tutorial.
*   ...archive a project's state in a single, human-readable file.
*   ...feel like a wizard who can build entire applications from a text file.

This extension is for those times.

## Installation

1.  Go to the **Extensions** view in VS Code/VSCodium.
2.  Search for **"Tree and Folders"**.
3.  Click **Install**.
4.  Enjoy your newfound, slightly absurd powers.

## Known issue
*   Welp you guessed it! no this still doesn't support images or gifs or anything that is not text as of yet, but am trying to implement a conversion step to base64, so wait for it in next releases!

## Contributing

Found a bug? Have an idea for an even more niche feature? Feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/MasterKraid/TREE-AND-FOLDERS).

---
Made with coffee and a healthy disregard for the Geneva convention.