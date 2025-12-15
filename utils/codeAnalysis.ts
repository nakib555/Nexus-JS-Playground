/**
 * Analyzes code to detect imported libraries.
 * Returns an array of library names to install.
 */
export const detectLibraries = (code: string, languageId: string): string[] => {
    const libs = new Set<string>();
    
    // Normalize code lines
    const lines = code.split('\n');
    
    if (languageId === 'python') {
        // Regex for Python:
        // import numpy
        // import numpy as np
        // from flask import Flask
        const regex = /^\s*(?:import|from)\s+([a-zA-Z0-9_\-]+)/;
        
        lines.forEach(line => {
            const match = line.match(regex);
            if (match && match[1]) {
                const lib = match[1].split('.')[0]; // Handle 'matplotlib.pyplot' -> 'matplotlib'
                // Filter out standard library modules (incomplete list, but good for MVP)
                const stdLib = ['sys', 'os', 'math', 'json', 'time', 'datetime', 'random', 're', 'collections', 'itertools', 'functools'];
                if (!stdLib.includes(lib)) {
                    libs.add(lib);
                }
            }
        });
    } 
    else if (languageId === 'javascript' || languageId === 'typescript') {
        // Regex for JS/TS:
        // import ... from 'lib'
        // require('lib')
        const importRegex = /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]([^'"]+)['"])|(?:require\(['"]([^'"]+)['"]))/g;
        
        let match;
        while ((match = importRegex.exec(code)) !== null) {
            // Group 1 is import, Group 2 is require
            const lib = match[1] || match[2];
            if (lib && !lib.startsWith('.') && !lib.startsWith('/')) {
                // Handle 'react/client' -> 'react' (scoped packages like @google/genai need care)
                let pkg = lib;
                if (lib.startsWith('@')) {
                    const parts = lib.split('/');
                    if (parts.length >= 2) pkg = `${parts[0]}/${parts[1]}`;
                } else {
                    pkg = lib.split('/')[0];
                }
                
                const stdLib = ['fs', 'path', 'http', 'https', 'os', 'util', 'events', 'crypto', 'child_process'];
                if (!stdLib.includes(pkg)) {
                    libs.add(pkg);
                }
            }
        }
    }
    else if (languageId === 'go') {
        // Go is slightly more complex with URL-like imports, but basic detection:
        // import "github.com/gin-gonic/gin"
        const regex = /import\s+(?:\(\s*)?"([^"]+)"/g; // Simplified
        let match;
        while ((match = regex.exec(code)) !== null) {
            const lib = match[1];
            // Filter standard library (heuristic: no dot in first segment usually means std lib in Go, though not always true)
            if (lib.includes('.')) {
                libs.add(lib);
            }
        }
    }

    return Array.from(libs);
};