import {
  type FooRepository,
  type Foo,
  type NewFoo,
  fooValidator,
} from "@ai-starter/core";

/**
 * These are the dependencies required by the CoreAppService.
 * We inject the *ports* (interfaces), not concrete implementations.
 */
export interface Deps {
  repos: {
    foo: FooRepository;
  };
}

/**
 * This is the factory function for the CoreAppService.
 *
 * @param deps The dependencies (ports) needed by the service.
 * @returns The CoreAppService.
 */
export const CoreAppService = (deps: Deps) => {
  const { repos } = deps;

  return {
    /**
     * Gets a single Foo item by its ID.
     * @param id The UUID of the foo.
     * @returns The Foo item, or null if not found.
     */
    getFoo: async (id: string): Promise<Foo | null> => {
      // Future business logic could go here (e.g., permissions checks)
      return repos.foo.get(id);
    },

    /**
     * Validates and creates a new Foo item.
     *
     * @param data The data for the new Foo
     * @returns The newly created Foo item.
     */
    createFoo: async (name: string): Promise<Foo> => {
      const newFoo: NewFoo = {
        name,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      fooValidator.parse(newFoo);
      return repos.foo.create(newFoo);
    },

    /**
     * Validates and updates the name of a Foo item.
     * @param id The UUID of the foo to patch.
     * @param name The new name.
     * @returns The updated Foo item.
     */
    patchFoo: async (id: string, name: string): Promise<Foo> => {
      fooValidator.shape.name.parse(name);
      return repos.foo.patch(id, name);
    },
  };
};

/**
 * Export the type of the service for use in other layers.
 */
export type CoreAppService = ReturnType<typeof CoreAppService>;
