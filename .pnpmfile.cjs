/**
 * pnpm hooks file
 * Automatically approves build scripts for specific packages
 */
function readPackage(pkg) {
  // Approve build scripts for these packages
  const approvedBuildScripts = [
    'esbuild',
    '@esbuild/win32-x64',
    '@esbuild/linux-x64',
    '@esbuild/darwin-x64',
    '@esbuild/darwin-arm64',
    'turbo',
  ];

  if (approvedBuildScripts.includes(pkg.name)) {
    // Mark as safe to run build scripts
    if (!pkg.pnpm) {
      pkg.pnpm = {};
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
