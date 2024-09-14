#!/bin/bash
reset=`tput sgr0`
out() {
  echo "$(tput setab 2)$1 ${reset}";
}

if [[ -z "$1" ]];
then
    echo "Please describe your commit, ./release 'your description'"
    exit
fi

git status
git status | grep -q 'Untracked files' && {
    echo "!!! >>>> Untracked files detected"
    echo "!!! >>>> Aborted"
    exit 
}
chmod +x *.sh

test -e package.json && {
  NEW_VERSION=$(npm version patch --git-tag-version=false)
  echo "New version: $NEW_VERSION"
  sleep 1
}

git commit -am "$1"


git push -u origin main
git tag $NEW_VERSION
git push origin $NEW_VERSION