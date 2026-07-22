const fs = require('fs').promises;
const path = require('path');

const linksPath = path.join(__dirname, 'links.json');

async function loadLinks() {
    try {
        const data = await fs.readFile(linksPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(linksPath, JSON.stringify([], null, 2), 'utf8');
            return [];
        }
        throw error;
    }
}

async function saveLinks(links) {
    await fs.writeFile(linksPath, JSON.stringify(links, null, 2), 'utf8');
}

function findLinkByCode(links, code) {
    return links.find(link => link.code === code);
}

function findLinkIndex(links, code) {
    return links.findIndex(link => link.code === code);
}

function generateUniqueCode(links) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code;
    let attempts = 0;
    
    do {
        code = '';
        for (let i = 0; i < 5; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        attempts++;
        if (attempts > 100) {
            for (let i = 0; i < 3; i++) {
                code += chars[Math.floor(Math.random() * chars.length)];
            }
            break;
        }
    } while (findLinkByCode(links, code));
    
    return code;
}

module.exports = { loadLinks, saveLinks, findLinkByCode, findLinkIndex, generateUniqueCode };