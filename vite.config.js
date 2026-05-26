import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storePath = path.join(__dirname, 'src/data/store.json')

function jsonStorePlugin() {
  return {
    name: 'json-store-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/store' && req.method === 'GET') {
          try {
            const data = fs.readFileSync(storePath, 'utf8')
            res.setHeader('Content-Type', 'application/json')
            res.end(data)
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
              fs.writeFileSync(storePath, JSON.stringify(parsed, null, 2), 'utf8')
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
})
