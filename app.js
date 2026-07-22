const express = require("express");
const { loadLinks, saveLinks, findLinkByCode, findLinkIndex, generateUniqueCode } = require('./storage');
const app = express();

app.use(express.json());

const apiRouter = express.Router();

apiRouter.use((req, res, next) => {
    req._startTime = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    console.log(req.method, req.path, req._startTime);
    next();
});

function validateUrl(req, res, next) {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'Поле url обязательно' });
    }
    
    if (typeof url !== 'string') {
        return res.status(400).json({ error: 'url должен быть строкой' });
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return res.status(400).json({ error: 'URL должен начинаться с http:// или https://' });
    }
    
    next();
}

let links = [];

async function init() {
    links = await loadLinks();
    console.log(`Загружено ${links.length} ссылок`);
}

apiRouter.get('/', (req, res) => {
    const { sort } = req.query;
    let result = [...links];
    
    if (sort === 'visits') {
        result.sort((a, b) => b.visits - a.visits);
    }
    
    res.json(result);
});

apiRouter.post('/', validateUrl, async (req, res) => {
    const { url } = req.body;
    
    const code = generateUniqueCode(links);
    const newLink = {
        code,
        url,
        visits: 0,
        createdAt: new Date().toISOString(),
    };
    
    links.push(newLink);
    await saveLinks(links);
    
    res.status(201).json(newLink);
});

apiRouter.get('/:code', (req, res) => {
    const { code } = req.params;
    const link = findLinkByCode(links, code);
    
    if (!link) {
        return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    
    res.json({
        code: link.code,
        url: link.url,
        visits: link.visits,
        createdAt: link.createdAt,
    });
});

apiRouter.delete('/:code', async (req, res) => {
    const { code } = req.params;
    const index = findLinkIndex(links, code);
    
    if (index !== -1) {
        links.splice(index, 1);
        await saveLinks(links);
    }
    
    res.status(204).send();
});

apiRouter.use((req, res) => {
    res.status(404).json({ error: 'API маршрут не найден' });
});

app.use('/api/links', apiRouter);

app.get('/:code', async (req, res) => {
    const { code } = req.params;
    const link = findLinkByCode(links, code);
    
    if (!link) {
        return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    
    link.visits += 1;
    await saveLinks(links);
    
    res.redirect(302, link.url);
});

app.use((req, res) => {
    res.status(404).json({ error: 'Страница не найдена' });
});

init().then(() => {
    app.listen(3000, () => console.log("http://localhost:3000"))
}) .catch(error => {
    console.error(`Ошибка: ${error.message}`);
    process.exit(1);
});