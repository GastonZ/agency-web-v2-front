export type ToolSpec = {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties?: Record<string, any>;
    required?: string[] | readonly string[];
    additionalProperties?: boolean;
  };
};
