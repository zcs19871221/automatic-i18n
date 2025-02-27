const onlyTJsxFiles = (fileOrDirName: string, directory: boolean) => {
  if (!directory && !fileOrDirName.match(/\.[tj]sx?$/)) {
    return false;
  }

  return true;
};

export default onlyTJsxFiles;
