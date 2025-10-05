export type HasKeys<T> = {
  [P in keyof T]: any;
};

export type Nothing = void;
