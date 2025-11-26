import type { FooRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    foo: FooRepository;
  };
}

export const CoreAppService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getFoo: repos.foo.get,
    createFoo: (name: string) => repos.foo.create({ name }),
    patchFoo: repos.foo.patch,
  };
};

export type CoreAppService = ReturnType<typeof CoreAppService>;
