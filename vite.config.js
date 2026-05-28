import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const productsPath = path.join(__dirname, 'src/data/products.json')
const settingsPath = path.join(__dirname, 'src/data/settings.json')
const usersPath = path.join(__dirname, 'src/data/users.json')
const ordersPath = path.join(__dirname, 'src/data/orders.json')

function jsonStorePlugin() {
  return {
    name: 'json-store-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/store' && req.method === 'GET') {
          try {
            const products = fs.existsSync(productsPath) ? JSON.parse(fs.readFileSync(productsPath, 'utf8') || '[]') : [];
            const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8') || '{}') : {};
            const users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]') : [];
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ products, settings, users }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        } else if (req.url === '/api/store' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              if (parsed.products) fs.writeFileSync(productsPath, JSON.stringify(parsed.products, null, 2), 'utf8')
              if (parsed.settings) fs.writeFileSync(settingsPath, JSON.stringify(parsed.settings, null, 2), 'utf8')
              if (parsed.users) fs.writeFileSync(usersPath, JSON.stringify(parsed.users, null, 2), 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonStorePlugin()],
  server: {
    allowedHosts: ['.ngrok-free.dev', 'confider-bristle-wackiness.ngrok-free.dev'],
  }
})
