/* eslint-disable no-console */
import process from 'node:process'
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait
} from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const DOCKER_IMAGE = process.env.DOCKER_IMAGE ?? 'vibescraper:latest'

describe('website Integration', () => {
  let network: StartedNetwork | null = null
  let postgres: StartedTestContainer | null = null
  let app: StartedTestContainer | null = null

  beforeAll(async () => {
    console.log('Testing image:', DOCKER_IMAGE)

    network = await new Network().start()

    postgres = await new GenericContainer('postgres:17-alpine')
      .withNetwork(network)
      .withNetworkAliases('postgres')
      .withEnvironment({
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpass',
        POSTGRES_DB: 'testdb'
      })
      .withExposedPorts(5432)
      .start()

    const databaseUrl = `postgresql://testuser:testpass@${postgres.getIpAddress(network.getName())}:5432/testdb`

    app = await new GenericContainer(DOCKER_IMAGE)
      .withNetwork(network)
      .withExposedPorts(4321)
      .withEnvironment({
        ...process.env, // All loaded env vars from .env.example
        NODE_ENV: 'development',
        DATABASE_URL: databaseUrl,
        PORT: '4321'
      })
      .withWaitStrategy(Wait.forHttp('/health', 4321).forStatusCode(200).withStartupTimeout(30000))
      .start()

    console.log('App container started')
  }, 120000) // 2 minute timeout for container setup

  afterAll(async () => {
    console.log('Cleaning up...')
    try {
      if (app) {
        await app.stop()
      }
      if (postgres) {
        await postgres.stop()
      }
      console.log('Cleanup complete')
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }, 30000)

  it('should serve index endpoint', async () => {
    expect.assertions(2)

    const host = app?.getHost()
    const port = app?.getMappedPort(4321)
    const response = await fetch(`http://${host}:${port}`)

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
  })
})
