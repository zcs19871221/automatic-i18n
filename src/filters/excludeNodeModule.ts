import path from 'path';

const excludeNodeModule = (fileOrDirName: string) => {
  if (
    fileOrDirName.includes('node_modules') ||
    path.basename(fileOrDirName).startsWith('.')
  ) {
    return false;
  }

  return true;
};

export default excludeNodeModule;
