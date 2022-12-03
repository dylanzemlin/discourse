export enum DiscouseUserFlags {
  None = 0,
  Admin = 1 << 0,
  Banned = 1 << 1,
  GlobalMuted = 1 << 2
}

export const hasFlag = (flags: DiscouseUserFlags, flag: DiscouseUserFlags) => (flags & flag) === flag;