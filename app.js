var staticPath = getParentDir(getFs().dir(window.location.href)) + 'static/';

// URL of the current file in editor
var currentFile;
var currentDir;

tinyMCE.init({
  mode: 'textareas',
  theme: 'advanced',
  height: '600',
  plugins: 'fullpage,preview,save',
  save_enablewhendirty: true,
  save_onsavecallback: 'saveFile',
  theme_advanced_buttons3_add: 'fullpage,preview,save',
  theme_advanced_resizing: true
});

function changeDir(url) {
  var ed = tinyMCE.get('content');

  ed.setProgressState(1);
  window.setTimeout(function() {
    internalListDir(getFs().dir(url));
    ed.setProgressState(0);
  }, 0);
}

function deleteDir(name, url) {
  if (confirm('Really delete ' + name + '?')) {
    var ed = tinyMCE.get('content');

    ed.setProgressState(1);
    window.setTimeout(function() {
      var dir = getFs().dir(url);

      dir.rm();
      internalListDir(getFs().dir(getParentDir(dir)));
      ed.setProgressState(0);
    }, 0);
  }
}

function deleteFile(name, url) {
  if (confirm('Really delete ' + name + '?')) {
    var ed = tinyMCE.get('content');

    ed.setProgressState(1);
    window.setTimeout(function() {
      var file = getFs().file(url);

      file.rm();
      internalListDir(currentDir);
      ed.setProgressState(0);
    }, 0);
  }
}

function getBaseURL() {
  return location.protocol + '//' + location.hostname + (location.port && ':' + location.port) + '/';
}

function getFs() {
  return new WebDAV.Fs(getBaseURL());
}

function getLanguage() {
  var languagePicker = document.getElementById('languagePicker');

  return languagePicker.options[languagePicker.selectedIndex].value;
}

function getNewDirName() {
  return document.getElementById('dirname').value;
}

function getNewFileName() {
  return document.getElementById('filename').value;
}

function getParentDir(dir) {
  var rootDir = staticPath;
  var parentDir = dir.url.substring(0, dir.url.substring(0, dir.url.length - 2).lastIndexOf('/') + 1);

  // remove double slashes when comparing
  return rootDir !== null && parentDir.replace(/\/\//g, '/') === rootDir.replace(/\/\//g, '/') ? null : parentDir;
}

function internalListDir(dir) {
  currentDir = dir;

  var children = dir.children();
  var div = document.getElementById('files');
  var ul = document.createElement('ul');

  // sort list
  var sortedDir = [];
  var sortedDirIndex = 0;

  for (var i = 1; i < children.length; i++) {
    if (children[i]) {
      sortedDir[sortedDirIndex++] = children[i];
    }
  }
  sortedDir.sort(function(a,b) {
    return a.type > b.type || (a.type === b.type && a.name > b.name);
  });

  ul.setAttribute('id', 'Navigation');

  // parent directory
  var parentDir = getParentDir(dir);

  if (parentDir !== null) {
    var li = document.createElement('li');
    var a = document.createElement('a');

    a.setAttribute('href', "javascript:changeDir('" + parentDir + "')");
    a.setAttribute('id', 'changeDir');
    a.appendChild(document.createTextNode('[...]'));
    li.appendChild(document.createTextNode('[' + dir.type + ']'));
    li.appendChild(a);
    ul.appendChild(li);
  }

  for (var index = 0; index < sortedDir.length; index++) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    var fileParts = sortedDir[index].name.split('/');

    li.appendChild(document.createTextNode('[' + sortedDir[index].type + ']'));

    if (sortedDir[index].type === 'file') {
      // load file
      a.setAttribute('href', "javascript:loadFile('" + sortedDir[index].url + "')");
      a.setAttribute('id', 'loadfile');
      a.appendChild(document.createTextNode(fileParts[fileParts.length - 1]));
      li.appendChild(a);

      li.appendChild(document.createTextNode(' '));

      // delete file
      a = document.createElement('a');
      a.setAttribute('href', "javascript:deleteFile('" + sortedDir[index].name + "','" + sortedDir[index].url + "')");
      a.setAttribute('id', 'deletefile');
    }
    else {
      // change directory
      a.setAttribute('href', "javascript:changeDir('" + sortedDir[index].url + "')");
      a.setAttribute('id', 'changeDir');
      a.appendChild(document.createTextNode(fileParts[fileParts.length - 1]));
      li.appendChild(a);

      li.appendChild(document.createTextNode(' '));

      // delete directory
      a = document.createElement('a');
      a.setAttribute('href', "javascript:deleteDir('" + sortedDir[index].name + "','" + sortedDir[index].url + "')");
      a.setAttribute('id', 'deletedir');
    }
    a.appendChild(document.createTextNode('delete'));
    li.appendChild(a);
    ul.appendChild(li);
  }
  if (div.firstChild !== null) {
    div.replaceChild(ul, div.firstChild);
  }
  else {
    div.appendChild(ul);
  }
}

function listDir(language) {
  var ed = tinyMCE.get('content');

  ed.setProgressState(1);
  window.setTimeout(function() {
    internalListDir(getFs().dir(staticPath + language));
    ed.setProgressState(0);
  }, 0);
}

function listLanguages() {
  var dir = getFs().dir(staticPath);
  var children = dir.children();
  var div = document.getElementById('languages');
  var select = document.createElement('select');

  select.setAttribute('id', 'languagePicker');
  select.setAttribute('onchange', 'javascript:listDir(getLanguage())');
  select.setAttribute('size', '1');
  for (var index = 1; index < children.length; index++) {
    if (children[index]) {
      var option = document.createElement('option');
      var fileParts = children[index].name.split('/');
      var language = fileParts[fileParts.length - 1];

      option.appendChild(document.createTextNode(language));
      select.appendChild(option);
    }
    div.appendChild(select);
  }
}

function loadFile(url) {
  currentFile = getFs().file(url);

  var ed = tinyMCE.get('content');

  ed.setProgressState(1);
  window.setTimeout(function() {
    ed.setContent(getFs().file(url + '?random=' + new Date().getTime()).read());
    ed.setProgressState(0);
  }, 0);
}

function newDir() {
  var dir = getFs().dir(currentDir.url + '/' + getNewDirName());

  dir.mkdir();

  var ed = tinyMCE.get('content');

  ed.setProgressState(1);
  window.setTimeout(function() {
    internalListDir(currentDir);
    ed.setProgressState(0);
  }, 0);
}

function newFile() {
  var ed = tinyMCE.get('content');

  ed.setContent('');
  currentFile = getFs().file(currentDir.url + '/' + getNewFileName());
}

function saveFile() {
  var ed = tinyMCE.get('content');

  ed.setProgressState(1);
  window.setTimeout(function() {
    currentFile.write(ed.getContent());
    internalListDir(currentDir);
    ed.setProgressState(0);
  }, 0);
}

function writeToDiv(line, emphasize) {
  var div = document.getElementById('files');
  var textnode = document.createTextNode(line);
  var newdiv = document.createElement('div');

  newdiv.appendChild(textnode);
  if (emphasize) {
    newdiv.style.color = 'red';
  } else {
    newdiv.style.color = 'blue';
  }
  div.appendChild(newdiv);
}
