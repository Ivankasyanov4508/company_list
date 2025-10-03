export type Observer<T> = (data: T[]) => void;
export type Unsubscribe = () => void;
