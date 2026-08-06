import asyncio
import os
import json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Injected credentials check
        auth_status = os.environ.get("LOVABLE_BROWSER_AUTH_STATUS")
        print(f"Auth Status: {auth_status}")
        
        storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
        session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
        
        await page.goto("http://localhost:8080")
        
        if storage_key and session_json:
            print("Injecting session...")
            await page.evaluate(
                f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
            )
            await page.goto("http://localhost:8080/app/perfil")
            await page.wait_for_load_state("networkidle")
            
            # Extract user info from DOM
            user_info = await page.evaluate('''() => {
                const name = document.querySelector('h3')?.textContent;
                const email = document.querySelector('p.text-muted-foreground')?.textContent;
                return { name, email };
            }''')
            print(f"User in UI: {user_info}")
        else:
            print("No session to inject.")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
