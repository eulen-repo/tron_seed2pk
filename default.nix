{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
      pkgs.nodejs_20
      pkgs.yarn
  ];
  shellHook = ''
    export PATH="$PWD/node_modules/.bin/:$PATH"
    export NPM_PACKAGES="$HOME/.npm-packages"
  '';
}
