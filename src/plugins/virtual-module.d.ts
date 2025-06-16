declare module "sylphry/config" {
  // you can tighten this up if you know your config schema
  const userConfig: Record<string, any>;
  export default userConfig;
}
