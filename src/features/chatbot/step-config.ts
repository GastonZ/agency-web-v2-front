export type RegisterFn = (name: string, fn: (...args: any[]) => any) => void;

export interface StepConfig<Fns = any> {
  getSchemas(step: number): any[];
  registerStep(register: RegisterFn, step: number, fns: Fns): void;
}
