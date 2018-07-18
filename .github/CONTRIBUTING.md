# Apostille-library Contributing Guide

Hi! We are really excited that you are interested in contributing to Apostille-library. Before submitting your contribution though, please make sure to take a moment and read through the following guidelines.

- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Issue Reporting Guidelines](#issue-reporting-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)

## Issue Reporting Guidelines

- Please try to stick to the template when creating a new issues.

## Pull Request Guidelines

- The `master` branch is basically just a snapshot of the latest stable release. All development should be done in dedicated branches. **Do not submit PRs against the `master` branch.**

- First checkout to the `develop` branch, and start a new branch `feature/YOUR_FEATUR` once done merge back against `develop`.

- Work in the `src` folder and **DO NOT** checkin `dist` in the commits.

- It's OK to have multiple small commits as you work on the PR - we will let GitHub automatically squash it before merging.

- Make sure `npm test` passes. (see [development setup](#development-setup))

- If adding new feature:
  - Add accompanying test case.
  - Provide convincing reason to add this feature. Ideally you should open a suggestion issue first and have it greenlighted before working on it.

- If fixing a bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update entities encoding/decoding (fix #3899)`.
  - Provide detailed description of the bug in the PR. Live demo preferred.
  - Add appropriate test coverage if applicable.

## Development Setup

You will need [Node.js](http://nodejs.org) **version 6+**

After cloning the repo, run:

``` bash
$ npm install # or yarn
```

### Committing Changes

Commit messages should follow the [commit message convention](./COMMIT_CONVENTION.md) so that changelogs can be automatically generated. Commit messages will be automatically validated upon commit. **If you are not familiar with the commit message convention, you should use `npm run commit` instead of `git commit`**, which provides an interactive CLI for generating proper commit messages.

### Commonly used NPM scripts

``` bash
# interactive CLI for generating proper commit messages
$ npm run commit

# run a lint check against the code
$ npm run lint

# build the projects and genrate a new dist folder
$ npm run build

# run the full test suite, with code coverage report
$ npm test

# run linting and testing
npm run validate
```

**Please make sure to have this pass successfully before submitting a PR.**

## Credits

Thank you to all the people who have already contributed to Apostille-libray!
