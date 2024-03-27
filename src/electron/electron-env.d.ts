
declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true';
    DIST: string;
    /** /dist/ or /public/ */
    PUBLIC: string;
  }
}