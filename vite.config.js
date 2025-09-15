import fs from 'node:fs'
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const ASSETS_ZIP_NAME = 'Assets.zip'

function resolveAssetsZip(root) {
  return path.resolve(root, ASSETS_ZIP_NAME)
}

function assetsZipDevPlugin() {
  return {
    name: 'assets-zip-dev-server',
    apply: 'serve',
    configureServer(server) {
      const zipPath = resolveAssetsZip(server.config.root)

      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        const requestUrl = req.url.split('?')[0]
        const lastSegment = requestUrl.substring(
          requestUrl.lastIndexOf('/') + 1,
        )

        if (lastSegment !== ASSETS_ZIP_NAME) {
          next()
          return
        }

        fs.stat(zipPath, (statError, stats) => {
          if (statError) {
            server.config.logger.error(
              `[assets-zip] ${ASSETS_ZIP_NAME} not found at ${zipPath}`,
            )
            res.statusCode = 404
            res.end()
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/zip')
          res.setHeader('Content-Length', stats.size)

          const stream = fs.createReadStream(zipPath)
          stream.on('error', (streamError) => {
            server.config.logger.error(
              `[assets-zip] failed to stream ${ASSETS_ZIP_NAME}: ${streamError.message}`,
            )
            res.statusCode = 500
            res.end()
          })

          stream.pipe(res)
        })
      })
    },
  }
}

function assetsZipBuildPlugin() {
  return {
    name: 'assets-zip-build',
    apply: 'build',
    generateBundle() {
      const zipPath = resolveAssetsZip(process.cwd())

      try {
        const source = fs.readFileSync(zipPath)
        this.emitFile({
          type: 'asset',
          fileName: ASSETS_ZIP_NAME,
          source,
        })
      } catch (error) {
        this.error(
          `[assets-zip] Unable to include ${ASSETS_ZIP_NAME} in build: ${error.message}`,
        )
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), assetsZipDevPlugin(), assetsZipBuildPlugin()],
})
