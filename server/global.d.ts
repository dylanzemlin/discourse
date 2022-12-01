namespace NodeJS {
  interface ProcessEnv {
    /**
   * The iron-session password used to encrypt/decrypt session cookies
   * 
   * @remarks
   * This **must** be at least 32 characters long
   */
    IRON_PASSWORD: string;
  }
}