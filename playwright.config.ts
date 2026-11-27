import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'./e2e',use:{baseURL:'http://127.0.0.1:4173/art-class-player/',viewport:{width:1366,height:768}},webServer:{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173/art-class-player/',reuseExistingServer:!process.env.CI},projects:[{name:'chromium',use:{browserName:'chromium'}}]})
