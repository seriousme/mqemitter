
var test = require('tap').test
  , mq = require('./')

test('support on and emit', function(t) {
  t.plan(1)

  var e = mq()
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }

  e.on('hello world', function(message, cb) {
    t.equal(message, expected)
    cb()
  })

  e.emit(expected, function() {
    t.end()
  })
})

test('support multiple subscribers', function(t) {
  t.plan(2)

  var e = mq()
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }

  e.on('hello world', function(message, cb) {
    t.ok(true)
    cb()
  })

  e.on('hello world', function(message, cb) {
    t.ok(true)
    cb()
  })

  e.emit(expected, function() {
    t.end()
  })
})

test('support wildcards', function(t) {
  t.plan(1)

  var e = mq()
    , expected = {
          topic: 'hello.world'
        , payload: { my: 'message' }
      }

  e.on('hello.*', function(message, cb) {
    t.equal(message.topic, 'hello.world')
    cb()
  })

  e.emit(expected, function() {
    t.end()
  })
})

test('support only one on argument', function(t) {
  t.plan(1)

  var e = mq()
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }

  e.on('hello world', function(cb) {
    t.ok(true)
    cb()
  })

  e.emit(expected, function() {
    t.end()
  })
})

test('queue concurrency', function(t) {
  t.plan(2)

  var e = mq({ concurrency: 1 })
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }
    , start
    , intermediate
    , finish

  e.on('hello 1', function(message, cb) {
    setTimeout(cb, 5)
  })

  e.on('hello 2', function(message, cb) {
    cb()
  })

  start = Date.now()
  e.emit({ topic: 'hello 1' }, function() {
    intermediate = Date.now()
    t.ok(intermediate - start >= 5, 'min 5 ms between start and intermediate')
  })

  e.emit({ topic: 'hello 2' }, function() {
    finish = Date.now()
    t.ok(finish - intermediate < 5, 'max 5 ms between intermediate and finish')
    t.end()
  })
})

test('queue maxlength', function(t) {
  t.plan(2)

  var e = mq({ maxlength: 1 })
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }

  e.on('hello 1', function(message, cb) {
    // fakely do not callback
  })

  start = Date.now()
  e.emit({ topic: 'hello 1' }, function() {})
  e.emit({ topic: 'hello 2' }, function() {})

  e.emit({ topic: 'hello 3' }, function(err) {
    t.ok(err, 'should return an error object')
    t.equal(err.message, 'Max queue length reached')
    t.end()
  })
})

test('removeListener', function(t) {
  var e = mq()
    , expected = {
          topic: 'hello world'
        , payload: { my: 'message' }
      }

  e.on('hello world', function(message, cb) {
    cb()
  })

  function toRemove(message, cb) {
    t.ok(false, 'the toRemove function must not be called')
    t.end()
  }

  e.on('hello world', toRemove)

  e.removeListener('hello world', toRemove)

  e.emit(expected, function() {
    t.end()
  })
})
