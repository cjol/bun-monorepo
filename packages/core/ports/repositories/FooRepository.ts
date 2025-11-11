import type { Foo, NewFoo } from "../../schema";

export interface FooRepository {
  get(id: string): Promise<Foo | null>;
  create(data: NewFoo): Promise<void>;
}
