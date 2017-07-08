'use strict';
const Path = require('path');
const Lab = require('lab');
const WhoSetIt = require('../lib');

const lab = exports.lab = Lab.script();
const expect = Lab.expect;
const describe = lab.describe;
const it = lab.it;

const fixturesDir = Path.join(__dirname, 'fixtures');
const Fixtures = require(Path.join(fixturesDir, 'use-cases'));


describe('Who Set It', () => {
  it('validates the schema of the returned object', (done) => {
    const proxy = WhoSetIt({ foo: 'bar' });

    expect(proxy.proxy).to.exist();
    expect(proxy.locations).to.equal([]);
    expect(proxy.revoke).to.be.a.function();
    done();
  });

  it('detects when properties are added', (done) => {
    let target = { foo: 1 };
    const proxy = WhoSetIt(target);

    target = proxy.proxy;
    target.foo = 2;
    target.bar = 3;
    target.baz = 4;

    expect(proxy.locations.length).to.equal(2);
    expect(proxy.locations[0]).to.equal({
      property: 'bar',
      filename: __filename,
      line: '31',
      column: '16'
    });
    expect(proxy.locations[1]).to.equal({
      property: 'baz',
      filename: __filename,
      line: '32',
      column: '16'
    });

    done();
  });

  it('proxies set operations to the target object', (done) => {
    const original = { foo: 1 };
    let target = original;

    expect(original).to.shallow.equal(target);
    expect('foo' in original).to.equal(true);
    expect('bar' in original).to.equal(false);
    expect('baz' in original).to.equal(false);

    const proxy = WhoSetIt(target);
    target = proxy.proxy;
    expect(original).to.not.shallow.equal(target);
    expect(proxy.proxy).to.shallow.equal(target);

    target.bar = 42;
    proxy.proxy.baz = 43;
    expect('foo' in original).to.equal(true);
    expect('bar' in original).to.equal(true);
    expect('baz' in original).to.equal(true);
    expect('foo' in original).to.equal(true);
    expect('bar' in target).to.equal(true);
    expect('baz' in target).to.equal(true);

    done();
  });

  it('revokes the proxy', (done) => {
    const original = { foo: 1 };
    const proxy = WhoSetIt(original);
    let target = proxy.proxy;

    target.bar = 2;
    expect(target).to.not.shallow.equal(original);
    target = proxy.revoke();
    expect(target).to.shallow.equal(original);
    target.baz = 3;

    // Verify that all writes succeeded, but only 'bar' was proxied.
    expect(original).to.equal({ foo: 1, bar: 2, baz: 3 });
    expect(proxy.locations.length).to.equal(1);
    expect(proxy.locations[0].property).to.equal('bar');

    // Verify that the proxy can be revoked multiple times.
    expect(proxy.revoke()).to.shallow.equal(target);
    done();
  });

  it('works with eval()', (done) => {
    let target = { foo: 1 };
    const proxy = WhoSetIt(target);

    target = proxy.proxy;
    Fixtures.useEval(target, 'target.bar = 42;');
    target = proxy.revoke();
    expect(target.bar).to.equal(42);
    done();
  });

  it('works with a new vm context', (done) => {
    let target = { foo: 1 };
    const proxy = WhoSetIt(target);

    target = proxy.proxy;
    Fixtures.useNewContext(target, 'target.bar = 45;');
    target = proxy.revoke();
    expect(target.bar).to.equal(45);
    expect(proxy.locations).to.equal([
      {
        property: 'bar',
        filename: 'evalmachine.<anonymous>',
        line: '1',
        column: '12'
      }
    ]);

    done();
  });

  it('works with a named new vm context', (done) => {
    let target = { foo: 1 };
    const proxy = WhoSetIt(target);

    target = proxy.proxy;
    Fixtures.useNewContext(target, 'target.bar = 45;', { filename: 'blah' });
    target = proxy.revoke();
    expect(target.bar).to.equal(45);
    expect(proxy.locations).to.equal([
      {
        property: 'bar',
        filename: 'blah',
        line: '1',
        column: '12'
      }
    ]);

    done();
  });

  it('works with the global object', (done) => {
    const original = global;
    const proxy = WhoSetIt(global);

    expect(global).to.shallow.equal(global.global);

    global = proxy.proxy; // eslint-disable-line no-global-assign
    expect(global).to.not.shallow.equal(original);
    expect(global).to.shallow.equal(global.global);

    global.foo = '123';
    proxy.proxy.bar = '456';

    // Inside of a lab test, the global object needs to be restored like this.
    // If the "normal" way of calling proxy.revoke() is used, lab's
    // instrumentation code will cause a crash because it will revoke the proxy
    // and then access the global object before control can return here.
    // It's worth noting that the normal proxy.revoke() approach can be used
    // outside of code instrumented by lab.
    global = original; // eslint-disable-line no-global-assign
    global = proxy.revoke(); // eslint-disable-line no-global-assign

    expect(global).to.shallow.equal(original);
    expect(global.foo).to.equal('123');
    expect(global.bar).to.equal('456');
    expect(global).to.shallow.equal(global.global);

    // Remove leaked globals.
    delete global.foo;
    delete global.bar;

    expect(proxy.locations.length).to.equal(2);
    expect(proxy.locations[0].property).to.equal('foo');
    expect(proxy.locations[0].filename).to.equal(__filename);
    expect(proxy.locations[1].property).to.equal('bar');
    expect(proxy.locations[1].filename).to.equal(__filename);

    done();
  });
});
