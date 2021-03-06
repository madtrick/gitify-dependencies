'use strict';

let _ = require('lodash');
let execSync = require('child_process').execSync;
let expect = require('../../../helper').expect;
let fs = require('fs-extra');
let path = require('path');

const demoPath = path.resolve(__dirname, '..', '..', '..', 'fixtures', 'demo');
const modulesPath = path.resolve(demoPath, 'node_modules');
const cliPath = path.resolve(__dirname, '..', '..', '..', '..', 'bin', 'gitify-deps.js');
const changelogPath = `${modulesPath}/keepachangelog`;
const lodashPath = `${modulesPath}/lodash`;

describe('gitify-deps', function () {
  describe('with GITIFY_URL_PATTERN', function () {
    let output;

    // Since gitification is very slow we are only executing the CLI once before all
    // tests. Create another test file if you need different behavior.
    before(function () {
      let options = {
        env: env({ GITIFY_URL_PATTERN: 'contentful' }),
        cwd: demoPath
      };

      this.timeout(30000);
      fs.removeSync(modulesPath);

      output = execSync(cliPath, options).toString();
    });

    it('only gitifies a single dependency', function () {
      expect(output.match(/Replacing.*with git repository/g)).to.have.length(1);
    });

    it('replaces the keepachangelog dependency with a git repository', function () {
      expect(output).to.contain(`Replacing ${changelogPath} with git repository ...`);
    });

    it('transforms the plain node module directory into a git repository', function () {
      isGitRepository(changelogPath);
    });

    it('checks out the right git hash', function () {
      let hash = fs.readFileSync(`${changelogPath}/.git/HEAD`).toString().trim();

      expect(hash).to.equal('eebd023c392a0b7fc5a6e0952e57be4d5485dd4e');
    });

    it('does not touch the lodash dependency', function () {
      expect(output).to.not.contain('lodash');
    });

    it('does not transform lodash into a git repository', function () {
      isNoGitRepository(lodashPath);
    });
  });
});

function env (args) {
  return _.extend(args, process.env);
}

function isGitRepository (path) {
  expect(function () {
    fs.statSync(`${path}/.git`);
  }).to.not.throw();
}

function isNoGitRepository (path) {
  expect(function () {
    fs.statSync(`${path}/.git`);
  }).to.throw(/no such file or directory/);
}
