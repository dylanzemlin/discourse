export enum DiscouseUserFlags {
  None = 0,
  Admin = 1 << 0,
  Banned = 1 << 1
}

export const hasFlag = (flags: DiscouseUserFlags, flag: DiscouseUserFlags) => (flags & flag) === flag;
export const addFlag = (flags: DiscouseUserFlags, flag: DiscouseUserFlags) => flags | flag;
export const removeFlag = (flags: DiscouseUserFlags, flag: DiscouseUserFlags) => flags & ~flag;