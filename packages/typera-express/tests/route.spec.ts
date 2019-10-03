import * as t from 'io-ts'
import { Parser, Response, URL, router, route } from '..'
import * as request from 'supertest'
import { makeApp } from './utils'

describe('route', () => {
  it('works', async () => {
    const routes = router(
      route('get', '/foo')()(_ => {
        return Response.ok('foo')
      })
    )
    const app = makeApp().use(routes.handler())

    request(app)
      .get('/foo')
      .expect(200)
  })

  it('supports adding multiple routes', async () => {
    const routes = router(
      route('get', '/foo')()(_ => {
        return Response.ok('foo')
      }),
      route('get', '/bar')()(_ => {
        return Response.ok('bar')
      })
    ).add(
      route('get', '/baz')()(_ => {
        return Response.ok('baz')
      }),
      route('get', '/quux')()(_ => {
        return Response.ok('quux')
      })
    )
    const app = makeApp().use(routes.handler())

    request(app)
      .get('/foo')
      .expect(200, 'foo')
    request(app)
      .get('/bar')
      .expect(200, 'bar')
    request(app)
      .get('/baz')
      .expect(200, 'baz')
    request(app)
      .get('/quux')
      .expect(200, 'quux')
  })

  it('decodes the request', async () => {
    const routes = router(
      route('post', '/decode/', URL.str('foo'))(
        Parser.query(t.type({ bar: t.string })),
        Parser.body(t.type({ baz: t.number }))
      )(request => {
        expect(request.routeParams).toEqual({ foo: 'FOO' })
        expect(request.query).toEqual({ bar: 'BAR' })
        expect(request.body).toEqual({ baz: 42 })
        return Response.noContent()
      })
    )
    const app = makeApp().use(routes.handler())

    await request(app)
      .post('/decode/FOO?bar=BAR')
      .send({ baz: 42 })
      .expect(204)
  })

  it('returns errors from middleware', async () => {
    const routes = router(
      route('post', '/error')(Parser.body(t.type({ foo: t.number })))(
        _request => {
          return Response.noContent()
        }
      )
    )
    const app = makeApp().use(routes.handler())

    await request(app)
      .post('/error')
      .send({ foo: 'bar' })
      .expect(
        400,
        'Invalid body: Invalid value "bar" supplied to : { foo: number }/foo: number'
      )
  })
})