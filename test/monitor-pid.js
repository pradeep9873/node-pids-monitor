/*jslint node: true, maxlen: 100, maxerr: 50, indent: 2 */
'use strict';

var expect      = require('chai').expect;
var MonitorPid  = require('../index.js');
var spawn       = require('child_process').spawn;
var exec        = require('child_process').exec;

before(function (){

});

describe('MonitorPid nodejs module', function () {
  this.timeout(5000);

  it('should return an error if started with an unknown pid @1', function (done) {
    getNonRunningPid(function (err, pidToTest) {
      var mp = new MonitorPid(pidToTest);
      mp.on('error', function (err) {
        expect(err.toString()).to.contain('is not running');
        done();
      });
      mp.start();
    });
  });
  
  it('should stop monitoring when the watched process is finished @2', function (done) {
    var p = spawn('sleep', ['0.1']);
    var pCode = undefined;
    p.on('exit', function (code) {
      pCode = code;
    })
    var mp = new MonitorPid(p.pid, { period: 10 }); // monitor each 10ms
    mp.on('end', function (pid) {
      expect(pCode).to.not.be.undefined;;
      expect(pCode).to.be.equal(0);
      expect(pid).to.be.equal(p.pid);
      done();
    });
    mp.start();
  });

  it('should stop monitoring when the "stop" method is called @3', function (done) {
    var p = spawn('sleep', ['2']);
    var pCode = undefined;
    p.on('exit', function (code) {
      pCode = code;
    })
    var mp = new MonitorPid(p.pid, { period: 10 }); // monitor each 10ms
    mp.on('end', function (pid) {
      expect(pCode, 'process should not have yet exited').to.be.undefined;;
      expect(pid).to.be.equal(p.pid);
      done();
    });
    mp.start();
    // stop the monitoring after 100ms
    setTimeout(function () {
      mp.stop();
    }, 100);
  });

  it('should return a JSON result @4', function (done) {
    var stats   = [];
    var p = spawn('sleep', ['0.1']);
    var mp = new MonitorPid(p.pid, { period: 10 }); // monitor each 10ms
    mp.on('monitored', function (pid, data) {
      stats.push(data);
    });
    mp.on('end', function (pid) {
      expect(stats).to.have.length.above(0);
      expect(stats[0]).to.be.an('object');
      done();
    });
    mp.start();
  });

  it('should return 2 results if period is 1.5s and the watched process die after 3.5s @5', function (done) {
    var stats   = [];
    var p = spawn('sleep', ['3.5']);
    var mp = new MonitorPid(p.pid, { period: 1500 });
    mp.on('monitored', function (pid, data) {
      stats.push(data);
    });
    mp.on('end', function (pid) {
      expect(stats).to.have.length(3);
      done();
    });
    mp.start();
  });

  it('should return a result with attended fields @6', function (done) {
    var stats   = [];
    var p = spawn('sleep', ['0.2']);
    var mp = new MonitorPid(p.pid, { period: 10 }); // monitor each 10ms
    mp.on('monitored', function (pid, data) {
      stats.push(data);
    });
    mp.on('end', function (pid) {
      expect(stats).to.have.length(1);
      expect(stats[0].parent_pid).to.not.be.undefined;
      expect(stats[0].active_pids).to.not.be.undefined;
      expect(stats[0].nb_pids).to.not.be.undefined;
      expect(stats[0].cpu).to.not.be.undefined;
      expect(stats[0].mem_vsz).to.not.be.undefined;
      expect(stats[0].mem_rss).to.not.be.undefined;
      expect(stats[0].disk_read).to.not.be.undefined;
      expect(stats[0].disk_write).to.not.be.undefined;
      done();
    });
    mp.start();
  });

});

describe('MonitorPid unix command', function () {

  it('should not be allowed to be run without parameters @7', function (done) {
    var cmd = __dirname + '/../bin/monitor-pid';
    var p = exec(cmd, function (err, stdout, stderr) {
      expect(p.exitCode).to.be.equal(1);
      expect(stderr).to.contain('Missing required arguments: pid');
      done();
    });
  });

  it('should return 1 if pid doesn\'t exist @8');
  it('should return CSV as a result if pid exists @9');

});

describe('MonitorPid dependencies', function () {
  it('should have pidstat installed on the system @3.1', function (done) {
    var p = exec('pidstat -V', function (err, stdout, stderr) {
      expect(p.exitCode).to.be.equal(0);
      done();
    });   
  });
  it('should have pidtree installed on the system @3.2');
});

after(function (){

});

var running = require('is-running');
function getNonRunningPid(cb, startPid) {
  if (!startPid) {
    startPid = 2000;
  }
  running(startPid, function (err, live) {
    if (err) return cb(err);
    if (!live) {
      cb(err, startPid);
    } else {
      getNonRunningPid(cb, startPid + 1);
    }
  });

}