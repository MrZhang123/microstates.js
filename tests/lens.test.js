import 'jest';
import { map } from 'funcadelic';
import { 
  compose,
  Const,
  Id,
  lensKey,
  lensPath,
  view,
  over,
  set,
  transparent
} from '../src/lens';

describe('Constant functor', () => {
  const { of, unbox } = Const;
  const five = of(5);

  it('can place a value into a constant box and get that value back', () => {
    expect(unbox(five)).toEqual(5);
  });
  
  it('does not change the value at all in the constant box when you map over it because it is constant!', () => {
    expect(unbox(map(value => value * 10, five))).toEqual(5);
  })
});

describe('Identity functor', () => {
  const { of, unbox } = Id;
  const number = of(5);

  it('can place a value into an id and get it out again', function() {
    expect(unbox(number)).toEqual(5);
  });

  it('applies the mapping function to the value in Id, and returns a new Id', function() {
    expect(unbox(map(v => v * 10, number))).toEqual(50);
  });
});

describe('Basic lenses', () => {
  const hello = lensKey('hello');

  it('can get from a transparent lens', () => {
    expect(view(transparent, 5)).toEqual(5);
    expect(over(transparent, value => value * 2, 5)).toEqual(10);
  });

  it('lets you update an object property', () => {
    expect(over(hello, v => `${v}!`, {hello: 'World'})).toEqual({hello: 'World!'});
  })

  it('let you set an object key', () => {
    expect(set(hello, 'Planet!', {hello: 'World'})).toEqual({hello: 'Planet!'});
  });

  it('lets you get a value from a key', () => {
    expect(view(hello, {hello: 'World!'})).toEqual('World!');
  });
});

describe('Composing lenses', () => {
  const hello = lensKey('hello');
  const message = lensKey('message');
  const message_hello = compose(message, hello);

  it('can be used to access deeply nested values', () => {
    expect(view(message_hello, { message: { hello: 'world' }})).toEqual('world');
  });
});

describe('lensPath', () => {
  const message_hello = lensPath(['message', 'hello']);

  it('can be used to access deeply nested values', () => {
    expect(view(message_hello, { message: { hello: 'world' }})).toEqual('world');
  });
  it('can be used to set deeply nested values', () => {
    expect(set(message_hello, 'planet', {message: {hello: 'world' }}))
      .toEqual({message: { hello: 'planet'}});
  });

  describe('punchouts', () => {
    const mkPunchout = () => set(lensPath(['x', 'y', 'z', 'w']), 5, undefined);

    it('should not throw', function() {
      expect(mkPunchout).not.toThrowError();
    });
    it('should create a deeply nested object', function() {
      const punchout = mkPunchout();
      expect(punchout).toHaveProperty('x');
      expect(punchout.x).toHaveProperty('y');
      expect(punchout.x.y).toHaveProperty('z');
      expect(punchout.x.y.z).toHaveProperty('w');
      expect(punchout.x.y.z.w).toBe(5);
    });
  });

  describe('maintains Types', () => {
    class Z {
      constructor() {
        this.w = 5;
      }
    }
    class Y {
      constructor() {
        this.z = new Z();
      }
    }
    class X {
      constructor() {
        this.y = new Y();
      }
    }

    const x = set(lensPath(['y', 'z', 'w']), 10, new X());

    it('should maintain type at any layer of the path', function() {
      expect(x).toBeInstanceOf(X);
      expect(x.y).toBeInstanceOf(Y);
      expect(x.y.z).toBeInstanceOf(Z);
      expect(x.y.z.w).toBe(10);
    });
  });
});
