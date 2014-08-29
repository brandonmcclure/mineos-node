var fs = require('fs-extra');
var path = require('path');
var async = require('async');
var mineos = require('../mineos');
var test = exports;

var BASE_DIR = '/var/games/minecraft';
var FS_DELAY_MS = 200;

test.tearDown = function(callback) {
  var server_list = new mineos.server_list(BASE_DIR);

  for (var i in server_list) {
    var instance = new mineos.mc(server_list[i], BASE_DIR);

    fs.removeSync(instance.env.cwd);
    fs.removeSync(instance.env.bwd);
    fs.removeSync(instance.env.awd);
  }
  callback();
}

test.server_list = function (test) {
  var servers = mineos.server_list(BASE_DIR);
  var instance = new mineos.mc('testing', BASE_DIR);

  instance.create(function(did_create) {
    servers = mineos.server_list(BASE_DIR);
    test.ok(servers instanceof Array, "server returns an array");
    test.done();
  })
};

test.server_list_up = function(test) {
  var servers = mineos.server_list_up();
  test.ok(servers instanceof Array);

  for (var i=0; i < servers.length; i++) {
    test.ok(/^(?!\.)[a-zA-Z0-9_\.]+$/.test(servers[i]));
  }

  test.done();
}

test.is_server = function(test) {
  //tests if sp exists
  var instance = new mineos.mc('testing', BASE_DIR);

  async.series([
    function(callback) {
      instance.is_server(function(is_server) {
        test.ok(!is_server);
        callback(null);
      })
    },
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.is_server(function(is_server) {
        test.ok(is_server);
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.create_server = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);
  var uid = 1000;
  var gid = 1001;

  test.equal(mineos.server_list(BASE_DIR).length, 0);

  async.series([
    function(callback) {
      instance.create(function(did_create){
        test.ok(did_create);

        test.ok(fs.existsSync(instance.env.cwd));
        test.ok(fs.existsSync(instance.env.bwd));
        test.ok(fs.existsSync(instance.env.awd));
        test.ok(fs.existsSync(instance.env.sp));

        test.equal(fs.statSync(instance.env.cwd).uid, uid);
        test.equal(fs.statSync(instance.env.bwd).uid, uid);
        test.equal(fs.statSync(instance.env.awd).uid, uid);
        test.equal(fs.statSync(instance.env.sp).uid, uid);

        test.equal(fs.statSync(instance.env.cwd).gid, gid);
        test.equal(fs.statSync(instance.env.bwd).gid, gid);
        test.equal(fs.statSync(instance.env.awd).gid, gid);
        test.equal(fs.statSync(instance.env.sp).gid, gid);

        test.equal(mineos.server_list(BASE_DIR)[0], server_name);
        test.equal(mineos.server_list(BASE_DIR).length, 1);
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.delete_server = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.is_server(function(is_server) {
        test.ok(is_server);
        callback(null);
      })
    },
    function(callback) {
      instance.delete(function(did_delete) {
        test.ok(did_delete);
        callback(null);
      })
    },
    function(callback) {
      instance.is_server(function(is_server) {
        test.ok(!is_server);
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.mc_instance = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  test.ok(instance.env instanceof Object);

  test.equal(instance.env.cwd, path.join(BASE_DIR, mineos.DIRS['servers'], server_name));
  test.equal(instance.env.bwd, path.join(BASE_DIR, mineos.DIRS['backup'], server_name));
  test.equal(instance.env.awd, path.join(BASE_DIR, mineos.DIRS['archive'], server_name));
  test.equal(instance.env.base_dir, BASE_DIR);
  test.equal(instance.server_name, server_name);
  test.equal(instance.env.sp, path.join(BASE_DIR, mineos.DIRS['servers'], server_name, 'server.properties'));
  test.done();
}

test.valid_server_name = function(test) {
  var regex_valid_server_name = /^(?!\.)[a-zA-Z0-9_\.]+$/;
  test.ok(mineos.valid_server_name('aaa'));
  test.ok(mineos.valid_server_name('server_1'));
  test.ok(mineos.valid_server_name('myserver'));
  test.ok(mineos.valid_server_name('1111'));
  test.ok(!mineos.valid_server_name('.aaa'));
  test.ok(!mineos.valid_server_name(''));
  test.ok(!mineos.valid_server_name('something!'));
  test.ok(!mineos.valid_server_name('#hashtag'));
  test.ok(!mineos.valid_server_name('my server'));
  test.ok(!mineos.valid_server_name('bukkit^ftb'));

  test.done();
}

test.start = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.start(function(did_start, proc) {
        test.ok(did_start);
        proc.once('close', function(code) {
          callback(null);
        })
      })
    },
    function(callback) {
      instance.property('screen_pid', function(pid) {
        test.equal(typeof(pid), 'number');
        test.ok(pid > 0);
        callback(null);
      })
    },
    function(callback) {
      instance.property('java_pid', function(pid) {
        test.equal(typeof(pid), 'number');
        test.ok(pid > 0);
        callback(null);
      })
    },
    function(callback) {
      instance.stuff('stop', function(did_stuff, proc) {
        proc.once('close', function(code) {
          test.ok(did_stuff);
          callback(null);
        })
      })
    },
    function(callback) {
      instance.delete(function(did_delete) {
        test.ok(did_delete);
        callback(null);
      })
    },
    function(callback) {
      instance.is_server(function(is_server) {
        test.ok(!is_server);
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.archive = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.archive(function(did_archve, proc) {
        test.ok(did_archve);
        proc.once('close', function(code) {
          setTimeout(function() {
            test.equal(fs.readdirSync(instance.env.awd).length, 1);
            callback(null);
          }, FS_DELAY_MS)
        })
        
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.backup = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.backup(function(did_backup, proc) {
        test.ok(did_backup);
        proc.once('close', function(code) {
          setTimeout(function() {
            test.equal(fs.readdirSync(instance.env.bwd).length, 2);
            callback(null);
          }, FS_DELAY_MS)
        })
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.restore = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.backup(function(did_backup, proc) {
        test.ok(did_backup);
        proc.once('close', function(code) {
          setTimeout(function() {
            test.equal(fs.readdirSync(instance.env.bwd).length, 2);
            callback(null);
          }, FS_DELAY_MS)
        })
      })
    },
    function(callback) {
      fs.removeSync(instance.env.cwd);
      instance.is_server(function(is_server) {
        test.ok(!is_server);
        callback(null);
      })
    },
    function(callback) {
      instance.restore('now', function(did_restore, proc) {
        test.ok(did_restore);
        proc.once('close', function(code) {
          setTimeout(function() {
            test.equal(fs.readdirSync(instance.env.cwd).length, 1);
            callback(null);
          }, FS_DELAY_MS)
        })
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.sp = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.sp(function(dict) {
        test.equal(dict['server-port'], '25565');
        callback(null);
      })
    },
    function(callback) {
      instance._sp.modify('server-port', '25570', function(err) {
        test.ok(!err);
        callback(null);
      })
    },
    function(callback) {
      instance.sp(function(dict) {
        test.equal(dict['server-port'], '25570');
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}

test.properties = function(test) {
  var server_name = 'testing';
  var instance = new mineos.mc(server_name, BASE_DIR);

  async.series([
    function(callback) {
      instance.create(function(did_create) {
        test.ok(did_create);
        callback(null);
      })
    },
    function(callback) {
      instance.property('up', function(up) {
        test.equal(up, false);
        callback(null);
      })
    },
    function(callback) {
      instance.property('server-port', function(port) {
        test.equal(port, '25565');
        callback(null);
      })
    },
    function(callback) {
      instance.property('server-ip', function(ip) {
        test.equal(ip, '0.0.0.0');
        callback(null);
      })
    }
  ], function(err, results) {
    test.done();
  })
}