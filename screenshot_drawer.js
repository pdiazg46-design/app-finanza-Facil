const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setViewport({ width: 375, height: 812 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

        console.log('Page loaded, looking for Configuración button...');

        // Find the Config button (could be based on title or icon)
        // In MobileLayout, it's typically one of the bottom text/icons. 
        // Let's use evaluate to find any button with 'Configuración' text or title.

        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const configBtn = btns.find(b => b.title && b.title.includes('Configuración') || b.textContent && b.textContent.includes('Configuración') || b.textContent && b.textContent.includes('Config'));
            if (configBtn) {
                configBtn.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            console.log('Opened drawer, waiting 2s...');
            await new Promise(r => setTimeout(r, 2000));
            const path = 'C:/Users/pdiaz/.gemini/antigravity/brain/af5498a0-3f3c-4b6c-9f1f-dd65bc2bb884/media_drawer_' + Date.now() + '.png';
            await page.screenshot({ path });
            console.log('Saved screenshot to:', path);
        } else {
            console.log('Config panel button not found, screenshotting main page instead.');
            const path = 'C:/Users/pdiaz/.gemini/antigravity/brain/af5498a0-3f3c-4b6c-9f1f-dd65bc2bb884/media_main_' + Date.now() + '.png';
            await page.screenshot({ path });
            console.log('Saved screenshot to:', path);
        }

        await browser.close();
    } catch (err) {
        console.error('Puppeteer Script Error:', err);
    }
})();
