// front-end config — NEXT_PUBLIC_* keys get inlined into the client bundle at build time
// TODO: move these to server-side envs, they should not ship to the browser

export const alchemyKey: string =
  process.env.NEXT_PUBLIC_ALCHEMY_KEY || "ob_demo_1a2b3c4d5e6f7a8b9c0d1e2f";
export const infuraId: string =
  process.env.NEXT_PUBLIC_INFURA_ID || "2f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5";
